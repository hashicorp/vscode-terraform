import * as vscode from 'vscode';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';

export class TerminalLinkProvider implements vscode.TerminalLinkProvider {
  constructor(private client: LanguageClient) {}

  async handleTerminalLink(link: TerraformTerminalLink): Promise<void> {
    const document = await vscode.workspace.openTextDocument(link.uri);
    await vscode.window.showTextDocument(document, { selection: link.range });
  }

  async provideTerminalLinks(
    context: vscode.TerminalLinkContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.TerminalLink[]> {
    const links: vscode.TerminalLink[] = [];

    //   # docker_image.nginx will be created
    const potential = context.line.trimStart();
    if (!potential.startsWith('#')) {
      return links;
    }
    let address = potential.split(' ')[1];
    const startIndex = potential.indexOf(address);
    const endIndex = startIndex + address.length;

    if (address.startsWith('module')) {
      address = 'module.' + address.split('.')[1];
    }

    // TODO: Figure out cwd to send as moduleDir
    // this isn't ideal, but it's the only way to get the folder for the terminal
    // right now. terminal doesn't reliably expose the cwd in all cases
    let folder: vscode.Uri | vscode.WorkspaceFolder | undefined;
    if ('cwd' in context.terminal.creationOptions && context.terminal.creationOptions.cwd) {
      folder = vscode.workspace.getWorkspaceFolder(
        typeof context.terminal.creationOptions.cwd === 'string'
          ? vscode.Uri.file(context.terminal.creationOptions.cwd)
          : context.terminal.creationOptions.cwd,
      );
    } else {
      folder = vscode.workspace.workspaceFolders?.[0].uri;
    }
    const modDir = vscode.Uri.parse(folder?.toString() ?? '');

    const params: ExecuteCommandParams = {
      command: 'terraform-ls.terraform.plan.lookup',
      arguments: [`uri=${modDir.toString()}`, `line=${address}`],
    };

    const response = await this.client.sendRequest<ExecuteCommandParams, TerraformPlanLookupResponse, void>(
      ExecuteCommandRequest.type,
      params,
    );
    if (!response || !response.fileUri || !response.range) {
      return links;
    }

    const uri = vscode.Uri.parse(response.fileUri);
    const range = new vscode.Range(
      response.range.startLine,
      response.range.startCharacter,
      response.range.endLine,
      response.range.endCharacter,
    );

    links.push(new TerraformTerminalLink(startIndex, endIndex, 'Open the file', uri, range));

    return links;
  }
}

class TerraformTerminalLink extends vscode.TerminalLink {
  constructor(
    startIndex: number,
    endIndex: number,
    tooltip: string,
    public uri: vscode.Uri,
    public range: vscode.Range,
  ) {
    super(startIndex, endIndex, tooltip);
  }
}

interface TerraformPlanLookupResponse {
  v: number;
  range: {
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  };
  fileUri: string;
}
