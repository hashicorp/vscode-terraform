import * as vscode from 'vscode';
import { runTerraform } from './runner';
import { getConfiguration } from './configuration';
import { Index, Section } from './index';

const Viz = require('viz.js');
const Dot = require('graphlib-dot');

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

    return `<!DOCTYPE html>
<html>
<body>
${element}
</body>
<script>
    let anchors = document.querySelectorAll('a');
    for (let anchor of anchors) {
      anchor.addEventListener('click', (event) => {
        const target = event.currentTarget;
        const uri = target.attributes['xlink:href'].value;

        const parts = uri.split(':', 2);

        if (parts[0] === 'terraform-section' && parts[1] !== '') {
          const sectionId = parts[1];
          const args = { targetId: sectionId };
          window.parent.postMessage({
            command: 'did-click-link',
            data: 'command:terraform.navigate-to-section?' + encodeURIComponent(JSON.stringify(args))
          }, 'file://');
        }
      });
    }
</script>
</html>`;
  }

  update(dot: string) {
    this.dot = dot;
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
  try {
    let dot = await runTerraform(["graph", "-draw-cycles", "-type=plan", getConfiguration().templateDirectory]);

    let processedDot = replaceNodesWithLinks(index, dot);

    provider.update(processedDot);

    await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
  } catch (e) {
    vscode.window.showErrorMessage(`Failed to do something: ${e}`);
  }
}