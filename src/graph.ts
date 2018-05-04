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
  private type: string = "";

  onDidChange = this._onDidChange.event;

  provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
    let svgDoc: string = Viz(this.dot);
    let start = svgDoc.indexOf('<svg');
    let end = svgDoc.indexOf('</svg>', start);

    let element = svgDoc.substr(start, end - start + 6);

    return `<!DOCTYPE html>
<html>
<body>
<h1>Graph (${this.type})</h1>
${element}
<a style="display: none" id="#hidden-link"></a>
</body>
<script>
    // body style
    let style = window.getComputedStyle(document.querySelector('body'), null);
    console.log(\`color: \${style.color}\`);
    console.log(\`fontSize: \${style.fontSize}\`);
    console.log(\`fontFamily: \${style.fontFamily}\`);

    // change style
    let texts = document.querySelectorAll('text');
    for (let text of texts) {
      text.style.fontFamily = style.fontFamily;
      text.style.fontSize = style.fontSize;
      text.style.fill = style.color;
    }

    // link style
    let linkStyle = window.getComputedStyle(document.getElementById('#hidden-link'), null);

    let anchors = document.querySelectorAll('a');
    for (let anchor of anchors) {
      let label = anchor.querySelector('text');
      label.style.fill = linkStyle.color;
      label.style.textDecoration = 'underline';

      console.log(anchor.href, anchor.style.color, linkStyle.color);
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

  let dot = await runTerraform(["graph", "-draw-cycles", `-type=${type}`, getConfiguration().templateDirectory]);

  let processedDot = replaceNodesWithLinks(index, dot);

  // make background transparent
  processedDot = processedDot.replace('digraph {\n', 'digraph {\n  bgcolor="transparent";\n');

  provider.update(processedDot, type);

  await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
}