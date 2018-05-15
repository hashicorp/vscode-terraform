import { execFile } from 'child_process';
import * as vscode from 'vscode';
import { outputChannel } from './extension';

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

export function lintCommand() {
  const configuration = vscode.workspace.getConfiguration("terraform");
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders === undefined) {
    vscode.window.showWarningMessage("terraform.lint can only be used when opening a folder");
    return;
  }

  workspaceFolders.forEach((workspaceFolder) => {
    if (workspaceFolder.uri.scheme !== "file") {
      // TODO: show warning?
      outputChannel.appendLine(`terraform.lint: Ignoring workspace folder ${workspaceFolder.name} with uri ${workspaceFolder.uri.toString()}, unsupported scheme.`);
      return;
    }

    const workspaceDir = workspaceFolder.uri.fsPath;
    lint(configuration["lintPath"], configuration["lintConfig"], workspaceDir)
      .then((issues) => {
        outputChannel.appendLine(`terraform.lint: ${issues.length} issues`);
        LintDiagnosticsCollection.clear();

        // group by filename first
        let issuesByFile = new Map<string, vscode.Diagnostic[]>();
        issues
          .forEach((issue) => {
            let diagnostic = toDiagnostic(issue);
            if (issuesByFile.has(issue.file))
              issuesByFile.get(issue.file).push(diagnostic);
            else
              issuesByFile.set(issue.file, [diagnostic]);
          });

        // report diagnostics
        issuesByFile.forEach((diagnostics, file) => {
          outputChannel.appendLine(`terraform.lint: ${file}: ${diagnostics.length} issues`);
          LintDiagnosticsCollection.set(vscode.Uri.file(`${workspaceDir}/${file}`), diagnostics);
        });

        outputChannel.appendLine("terraform.lint: Done");
      }).catch((error) => {
        outputChannel.appendLine(`terraform.lint: Failed: ${error}`);
        vscode.window.showErrorMessage("Linting failed, more information in the output tab.");
      });
  });
}

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