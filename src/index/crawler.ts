import * as minimatch from 'minimatch';
import * as vscode from 'vscode';
import { Logger } from '../logger';
import { Reporter } from '../telemetry';
import { IndexAdapter } from './index-adapter';

export class FileSystemWatcher extends vscode.Disposable {
  private logger = new Logger("file-system-watcher");
  private watcher: vscode.FileSystemWatcher;

  constructor(private index: IndexAdapter) {
    super(() => this.dispose());

    this.watcher = vscode.workspace.createFileSystemWatcher("**/*.{tf,tfvars}");
    this.watcher.onDidChange(async (uri) => {
      await this.updateDocument(uri);
    });
    this.watcher.onDidCreate(async (uri) => {
      await this.updateDocument(uri);
    });
    this.watcher.onDidDelete(uri => this.onDidDelete(uri));
  }

  dispose() {
    this.watcher.dispose();
  }

  async crawl(): Promise<vscode.Uri[]> {
    this.logger.info("Crawling workspace for terraform files...");
    const start = process.hrtime();
    const files = await vscode.workspace.findFiles("**/*.{tf,tfvars}");

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Indexing terraform templates",
      cancellable: false
    }, async (progress) => {
      for (let i = 0; i < files.length; ++i) {
        const uri = files[i];

        // Exclude the configured paths from the FindFiles results
        // before indexing those files unnecessarily on init.
        if (this.index.excludePaths.length > 0) {
          let path = vscode.workspace.asRelativePath(uri).replace('\\', '/');
          let matches = this.index.excludePaths.map((pattern) => {
            return minimatch(path, pattern);
          });
          if (matches.some((v) => v)) {
            // ignore
            this.logger.debug(`Ignoring document: ${uri.toString()}`);
          } else {
            await this.updateDocument(uri);
          }
        }

        progress.report({
          message: `Indexing ${uri.toString()}`,
          increment: files.length / 100
        });
      }
    });

    const elapsed = process.hrtime(start);
    const elapsedMs = elapsed[0] * 1e3 + elapsed[1] / 1e6;

    Reporter.trackEvent("initialCrawl", {}, {
      totalTimeMs: elapsedMs,
      numberOfDocs: files.length,
      averagePerDocTimeMs: elapsedMs / files.length
    });
    return files;
  }

  private onDidDelete(uri: vscode.Uri) {
    try {
      this.index.delete(uri);
    } catch (error) {
      this.logger.exception(`Could not delete index for deleted file: ${uri.toString()}`, error);
    }
  }

  private async updateDocument(uri: vscode.Uri) {
    let doc = await vscode.workspace.openTextDocument(uri);

    if (doc.isDirty || doc.languageId !== "terraform") {
      // ignore
      return;
    }

    try {
      let [file, group] = this.index.indexDocument(doc);
      if (!file || !group) {
        this.logger.info(`Index not generated for: ${uri.toString()}`);
      } else {
        this.logger.info(`Indexed ${uri.toString()}`);
      }

    } catch (e) {
      this.logger.exception("Could not index template file", e);

      let range = new vscode.Range(0, 0, 0, 300);
      let diagnostics = new vscode.Diagnostic(range, `Unhandled error parsing document: ${e}`, vscode.DiagnosticSeverity.Error);

      this.index.errors.set(uri, [diagnostics]);
    }
  }
}