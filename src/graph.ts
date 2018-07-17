import * as vscode from 'vscode';
import { read } from './helpers';
import { loadTemplate } from './template';

const Viz = require('viz.js');

export let graphPreviewUri = vscode.Uri.parse('terraform-graph://authority/terraform-graph');

export class GraphContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private dot: string = "";
  private type: string = "";
  private workspaceFolderName: string = "";

  onDidChange = this._onDidChange.event;

  constructor(private ctx: vscode.ExtensionContext) { }

  async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
    let template = await read(this.ctx.asAbsolutePath('out/src/ui/graph.html'));

    let svgDoc: string = Viz(this.dot);
    let start = svgDoc.indexOf('<svg');
    let end = svgDoc.indexOf('</svg>', start);

    let element = svgDoc.substr(start, end - start + 6);

    return loadTemplate(this.ctx.asAbsolutePath('out/src/ui/graph.html'), {
      type: this.type,
      element: element,
      workspaceFolderName: this.workspaceFolderName
    });
  }

  update(dot: string, type: string, workspaceFolderName: string) {
    this.dot = dot;
    this.type = type;
    this.workspaceFolderName = workspaceFolderName;
    this._onDidChange.fire();
  }
}