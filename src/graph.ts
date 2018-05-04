import * as vscode from 'vscode';
import { runTerraform } from './runner';
import { getConfiguration } from './configuration';

const Viz = require('viz.js');

export let graphPreviewUri = vscode.Uri.parse('terraform-graph://authority/terraform-graph');

export class GraphContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private dot: string = "";

  onDidChange = this._onDidChange.event;

  provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
    let svgDoc: string = Viz(this.dot);
    let start = svgDoc.indexOf('<svg');
    let end = svgDoc.indexOf('</svg>', start);

    let element = svgDoc.substr(start, end - start + 6);

    return `<body>${element}</body>`;
  }

  update(dot: string) {
    this.dot = dot;
    this._onDidChange.fire();
  }
}

export async function graphCommand(provider: GraphContentProvider): Promise<void> {
  try {
    let dot = await runTerraform(["graph", "-draw-cycles", "-type=plan", getConfiguration().templateDirectory]);

    provider.update(dot);

    await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
  } catch (e) {
    vscode.window.showErrorMessage(`Failed to do something: ${e}`);
  }
}