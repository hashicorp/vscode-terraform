import * as vscode from 'vscode';
import { exec } from 'child_process';

import { errorDiagnosticCollection } from './extension';
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

export function lintCommand() {
  const configuration = vscode.workspace.getConfiguration("terraform");
  const workspaceDir = vscode.workspace.rootPath;

  if (workspaceDir === undefined) {
    vscode.window.showWarningMessage("terraform.lint can only be used when opening a folder");
    return;
  }

  lint(configuration["lintPath"], configuration["lintConfig"], workspaceDir)
    .then((issues) => {
      outputChannel.appendLine(`terraform.lint: ${issues.length} issues`);
      errorDiagnosticCollection.clear();

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
        errorDiagnosticCollection.set(vscode.Uri.file(`${workspaceDir}/${file}`), diagnostics);
      });

      outputChannel.appendLine("terraform.lint: Done");
    }).catch((error) => {
      outputChannel.appendLine("terraform.lint: Failed:");
      outputChannel.append(error);
      vscode.window.showErrorMessage("Linting failed, more information in the output tab.");
    });
}

function lint(execPath: string, lintConfig: string, workspaceDir: string): Promise<Issue[]> {
  return new Promise<any[]>((resolve, reject) => {
    let commandLineParts = [execPath, "--format", "json"];
    if (lintConfig !== null) {
      commandLineParts.push("--config", lintConfig);
    }

    const child = exec(commandLineParts.join(" "), {
      cwd: workspaceDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
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