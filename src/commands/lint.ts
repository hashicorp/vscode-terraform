import { execFile } from "child_process";
import * as vscode from "vscode";
import { Command, CommandType } from "./command";

export class LintCommand extends Command {
  public static readonly CommandName = "lint";
  constructor(ctx: vscode.ExtensionContext) {
    super(LintCommand.CommandName, ctx, CommandType.PALETTE);
  }

  protected async perform(): Promise<any> {
    const configuration = vscode.workspace.getConfiguration("terraform");

    if (vscode.workspace.workspaceFolders === undefined) {
      return await vscode.window.showWarningMessage("terraform.lint can only be used when opening a folder");
    }

    LintDiagnosticsCollection.clear();
    let success = true;

    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
      if (workspaceFolder.uri.scheme !== "file") {
        this.logger.warn(`Ignoring workspace folder ${workspaceFolder.name} with uri ${workspaceFolder.uri.toString()}, unsupported scheme.`);
        continue;
      }

      const workspaceDir = workspaceFolder.uri.fsPath;
      try {
        const issues = await lint(configuration["lintPath"], configuration["lintConfig"], workspaceDir);
        this.logger.info(`${issues.length} issues`);

        this.groupIssues(issues).forEach((diagnostics, file) => {
          this.logger.info(`${file}: ${diagnostics.length} issues`);
          LintDiagnosticsCollection.set(vscode.Uri.file(`${workspaceDir}/${file}`), diagnostics);
        });
      } catch (error) {
        this.logger.exception(`Linting failed for ${workspaceDir}`, error);
        success = false;
      }
    }

    if (!success) {
      return await vscode.window.showErrorMessage("Linting failed, more information in the output tab.");
    }
  }

  private groupIssues(issues: Issue[]): Map<string, vscode.Diagnostic[]> {
    let issuesByFile = new Map<string, vscode.Diagnostic[]>();
    issues
      .forEach((issue) => {
        let diagnostic = toDiagnostic(issue);
        if (issuesByFile.has(issue.file))
          issuesByFile.get(issue.file).push(diagnostic);
        else
          issuesByFile.set(issue.file, [diagnostic]);
      });
    return issuesByFile;
  }
}

type Issue = {
  type: string;
  message: string;
  line: number;
  file: string;
}

function typeToSeverity(type: string): vscode.DiagnosticSeverity {
  switch (type) {
    case "ERROR":
      return vscode.DiagnosticSeverity.Error;
    case "WARNING":
      return vscode.DiagnosticSeverity.Warning;
    case "NOTICE":
      return vscode.DiagnosticSeverity.Information;
  }

  return vscode.DiagnosticSeverity.Error;
}

function toDiagnostic(issue: Issue): vscode.Diagnostic {
  return new vscode.Diagnostic(new vscode.Range(issue.line - 1, 0, issue.line - 1, 100),
    issue.message, typeToSeverity(issue.type));
}

export let LintDiagnosticsCollection = vscode.languages.createDiagnosticCollection("terraform-lint");

function lint(execPath: string, lintConfig: string, workspaceDir: string): Promise<Issue[]> {
  return new Promise<any[]>((resolve, reject) => {
    let commandLineArgs = ["--format", "json"];
    if (lintConfig !== null) {
      commandLineArgs.push("--config", lintConfig);
    }

    const child = execFile(execPath, commandLineArgs, {
      cwd: workspaceDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        try {
          let result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}