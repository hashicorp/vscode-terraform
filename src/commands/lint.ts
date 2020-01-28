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
        if (issuesByFile.has(issue.range.filename))
          issuesByFile.get(issue.range.filename).push(diagnostic);
        else
          issuesByFile.set(issue.range.filename, [diagnostic]);
      });
    return issuesByFile;
  }
}

/*
Issue structure as of tflint > 0.10.1
{
    "callers": [
    ],
    "message": "`kubernetes-thing` resource name has a dash",
    "range": {
        "end": {
            "column": 53,
            "line": 7
        },
        "filename": "main.tf",
        "start": {
            "column": 1,
            "line": 7
        }
    },
    "rule": {
        "link": "https://github.com/terraform-linters/tflint/blob/v0.13.4/docs/rules/terraform_dash_in_resource_name.md",
        "name": "terraform_dash_in_resource_name",
        "severity": "info"
    }
}
*/

type Issue = {
  message: string;
  range: IssueRange;
  rule: IssueRule;
};

type IssueRange = {
  filename: string;
  start: IssuePosition;
  end: IssuePosition;
};

type IssuePosition = {
  column: number;
  line: number;
};

type IssueRule = {
  link: string;
  name: string;
  severity: string;
};

function typeToSeverity(type: string): vscode.DiagnosticSeverity {
  switch (type) {
    case "error":
      return vscode.DiagnosticSeverity.Error;
    case "warning":
      return vscode.DiagnosticSeverity.Warning;
    case "notice":
      return vscode.DiagnosticSeverity.Information;
  }

  return vscode.DiagnosticSeverity.Error;
}

function toDiagnostic(issue: Issue): vscode.Diagnostic {
  return new vscode.Diagnostic(
    new vscode.Range(issue.range.start.line - 1, issue.range.start.column - 1, issue.range.end.line - 1, issue.range.end.column - 1),
    issue.message,
    typeToSeverity(issue.rule.severity));
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
      if (error["code"] < 2 || error["code"] > 3) {
        // 0: No issues found - won't enter this block
        // 2: Errors occurred (can be parsed below)
        // 3: No errors occurred, but issues found (can be parsed below)
        // https://github.com/terraform-linters/tflint/blob/000c2eb1a92bb43b1107372ea409bd7f2008caac/cmd/cli.go#L26
        reject(error);
      } else {
        try {
          // tflint > 0.10.1 returns errors in two arrays:
          // {"issues":[],"errors":[]}
          // https://github.com/terraform-linters/tflint/blob/000c2eb1a92bb43b1107372ea409bd7f2008caac/formatter/json.go
          // Errors only contain messages from terraform, not lint issues.
          let result = JSON.parse(stdout);
          if (result["errors"].length > 0) {
            // Just pick the first error. This is pretty rare.
            reject(result["errors"][0]);
          }
          resolve(result["issues"]);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}