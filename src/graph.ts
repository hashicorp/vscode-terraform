import * as vscode from 'vscode';
import { read } from './helpers';
import { IndexGroup } from './index/group';
import { loadTemplate } from './template';

const Viz = require('viz.js');

export async function createGraphWebView(dot: string, type: string, group: IndexGroup, ctx: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
  let template = await read(ctx.asAbsolutePath('out/src/ui/graph.html'));

  let svgDoc: string = Viz(dot);
  let start = svgDoc.indexOf('<svg');
  let end = svgDoc.indexOf('</svg>', start);

  let element = svgDoc.substr(start, end - start + 6);

  let rendered = await loadTemplate(ctx.asAbsolutePath('out/src/ui/graph.html'), {
    type: type,
    element: element,
    groupUri: group.uri.toString()
  });

  let panel = vscode.window.createWebviewPanel(
    'terraform.preview-graph',
    `Terraform: Graph (${type})`,
    vscode.ViewColumn.Active);
  panel.webview.html = rendered;
  return panel;
}