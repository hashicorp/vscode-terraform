import * as vscode from 'vscode';

import { runTerraform } from './runner';
import { getConfiguration } from './configuration';
import { Index, Section } from './index';
import { outputChannel } from './extension';
import { readFile } from 'fs';
import { read } from './helpers';
import { loadTemplate } from './template';

const Viz = require('viz.js');
const Dot = require('graphlib-dot');

export let graphPreviewUri = vscode.Uri.parse('terraform-graph://authority/terraform-graph');

export class GraphContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private dot: string = "";
  private type: string = "";

  onDidChange = this._onDidChange.event;

  constructor(private ctx: vscode.ExtensionContext) {}

  async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
    let template = await read(this.ctx.asAbsolutePath('out/src/ui/graph.html'));

    let svgDoc: string = Viz(this.dot);
    let start = svgDoc.indexOf('<svg');
    let end = svgDoc.indexOf('</svg>', start);

    let element = svgDoc.substr(start, end - start + 6);

    return loadTemplate(this.ctx.asAbsolutePath('out/src/ui/graph.html'), {
      type: this.type,
      element: element
    });
  }

  update(dot: string, type: string) {
    this.dot = dot;
    this.type = type;
    this._onDidChange.fire();
  }
}

function replaceNodesWithLinks(index: Index, dot: string): string {
  const regex = /(\[[a-z0-9 ]+\] )?([^ ]+)/;
  let graph = Dot.read(dot);

  let changedNodes = new Map<string, Section>();
  for (let node of graph.nodes()) {
    let targetId = node.match(regex)[2];

    let section = index.section(targetId);
    if (section) {
      changedNodes.set(node, section);
    }
  }

  for (let [node, section] of changedNodes) {
    graph.setNode(node, { href: `terraform-section:${section.id()}` });
  }

  return Dot.write(graph);
}

export async function graphCommand(index: Index, provider: GraphContentProvider): Promise<void> {
  const types = ['plan', 'plan-destroy', 'apply',
    'validate', 'input', 'refresh'];
  let type = await vscode.window.showQuickPick(types, { placeHolder: "Choose graph type" });

  let workspaceFolder = vscode.workspace.workspaceFolders[0];
  if (workspaceFolder.uri.scheme !== "file") {
    vscode.window.showErrorMessage("Workspace folder needs to use the file:/// uri scheme.");
    return;
  }

  let templateDirectory = workspaceFolder.uri.with({
    path: workspaceFolder.uri.path // + '/' + getConfiguration().templateDirectory
  });

  try {
    let dot = await runTerraform(["graph", "-draw-cycles", `-type=${type}`, templateDirectory.fsPath]);

    let processedDot = replaceNodesWithLinks(index, dot);

    // make background transparent
    processedDot = processedDot.replace('digraph {\n', 'digraph {\n  bgcolor="transparent";\n');

    provider.update(processedDot, type);

    await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
  } catch (e) {
    outputChannel.appendLine('Generating graph preview failed:');
    let lines = e.split(/[\r?\n]+/);
    for (let line of lines)
      outputChannel.appendLine('\t' + line);
    outputChannel.show();
    await vscode.window.showErrorMessage(`Error generating graph, see output view.`);
  }
}