// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import child_process = require('child_process');
import * as os from 'os';
import * as vscode from 'vscode';

interface TerraformInfo {
  version: string;
  platform: string;
  outdated: boolean;
}

interface VSCodeExtension {
  name: string;
  publisher: string;
  version: string;
}

export class GenerateBugReportCommand implements vscode.Disposable {
  constructor(private ctx: vscode.ExtensionContext) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('opentofu.generateBugReport', async () => {
        const problemText = await vscode.window.showInputBox({
          title: 'Generate a Bug Report',
          prompt: 'Enter a short description of the problem or hit enter to submit now',
          placeHolder: "For example: I'm having trouble getting autocomplete to work when I...",
        });

        const extensions = this.getExtensions();
        const body = await this.generateBody(extensions, problemText);
        const encodedBody = encodeURIComponent(body);
        const fullUrl = `https://github.com/gamunu/vscode-opentofu/issues/new?body=${encodedBody}`;
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(fullUrl));
      }),
    );
  }

  dispose(): void {
    // throw new Error('Method not implemented.');
  }

  async generateBody(extensions: VSCodeExtension[], problemText?: string): Promise<string> {
    if (!problemText) {
      problemText = `Steps To Reproduce
=====

Steps to reproduce the behavior:

1. Go to '...'
2. Type '...'
3. See error

Include any relevant Terraform configuration or project structure:

\`\`\`terraform
resource "github_repository" "test" {
  name = "vscode-terraform"
}
\`\`\`


You can use 'tree' to output ASCII-based hierarchy of your project.

If applicable, add screenshots to help explain your problem.

Expected Behavior
-----

<!-- What should have happened? -->

Actual Behavior
-----

<!-- What actually happened? -->

Additional context
-----

<!--
Add any other context about the problem here.
Note whether you use any tools for managing Terraform version/execution (e.g. 'tfenv')
any credentials helpers, or whether you have any other Terraform extensions installed.
-->
`;
    }
    const body = `Issue Description
=====

${problemText}

Environment Information
=====

Terraform Information
-----

${this.generateRuntimeMarkdown(await this.getRuntimeInfo())}

Visual Studio Code
-----

| Name | Version |
| --- | --- |
| Operating System | ${os.type()} ${os.arch()} ${os.release()} |
| VSCode | ${vscode.version}|

Visual Studio Code Extensions
-----

<details><summary>Visual Studio Code Extensions(Click to Expand)</summary>

${this.generateExtesnionMarkdown(extensions)}
</details>

Extension Logs
-----

> Find this from the first few lines of the relevant Output pane:
View -> Output -> 'HashiCorp Terraform'

`;
    return body;
  }

  generateExtesnionMarkdown(extensions: VSCodeExtension[]): string {
    if (!extensions.length) {
      return 'none';
    }

    const tableHeader = `|Extension|Author|Version|\n|---|---|---|`;
    const table = extensions
      .map((e) => {
        return `|${e.name}|${e.publisher}|${e.version}|`;
      })
      .join('\n');

    const extensionTable = `${tableHeader}\n${table}`;
    return extensionTable;
  }

  generateRuntimeMarkdown(info: TerraformInfo): string {
    const rows = `
Version:\t${info.version}
Platform:\t${info.platform}
Outdated:\t${info.outdated}
    `;
    return rows;
  }

  getExtensions(): VSCodeExtension[] {
    const extensions = vscode.extensions.all
      .filter((element) => element.packageJSON.isBuiltin === false)
      .sort((leftside, rightside): number => {
        if (leftside.packageJSON.name.toLowerCase() < rightside.packageJSON.name.toLowerCase()) {
          return -1;
        }
        if (leftside.packageJSON.name.toLowerCase() > rightside.packageJSON.name.toLowerCase()) {
          return 1;
        }
        return 0;
      })
      .map((ext) => {
        return {
          name: ext.packageJSON.name,
          publisher: ext.packageJSON.publisher,
          version: ext.packageJSON.version,
        };
      });
    return extensions;
  }

  async getRuntimeInfo(): Promise<TerraformInfo> {
    const terraformExe = 'tofu';
    const spawn = child_process.spawnSync;

    // try to get version from a newer terraform binary
    const resultJson = spawn(terraformExe, ['version', '-json']);
    if (resultJson.error === undefined) {
      try {
        const response = resultJson.stdout.toString();
        const j = JSON.parse(response);

        return {
          version: j.terraform_version,
          platform: j.platform,
          outdated: j.terraform_outdated,
        };
      } catch {
        // fall through
      }
    }

    // try an older binary without the json flag
    const result = spawn(terraformExe, ['version']);
    if (result.error === undefined) {
      try {
        const response = result.stdout.toString() || result.stderr.toString();
        const regex = new RegExp('v?(?<version>[0-9]+(?:.[0-9]+)*(?:-[A-Za-z0-9.]+)?)');
        const matches = regex.exec(response);

        const version = matches && matches.length > 1 ? matches[1] : 'Not found';
        const platform = response.split('\n')[1].replace('on ', '');

        return {
          version: version,
          platform: platform,
          outdated: true,
        };
      } catch {
        // fall through
      }
    }

    return {
      version: 'Not found',
      platform: 'Not found',
      outdated: false,
    };
  }
}
