import * as vscode from "vscode";
import { indexLocator } from "../extension";
import { GraphContentProvider, graphPreviewUri } from "../graph";
import { Index } from "../index";
import { Section } from "../index/section";
import { runTerraform } from "../runner";
import { Command } from "./command";

const Dot = require('graphlib-dot');

export class PreviewGraphCommand extends Command {
  constructor(private provider: GraphContentProvider) {
    super("preview-graph");
  }

  protected async perform(): Promise<any> {
    const types = ['plan', 'plan-destroy', 'apply',
      'validate', 'input', 'refresh'];
    let type = await vscode.window.showQuickPick(types, { placeHolder: "Choose graph type" });

    let workspaceFolder = await vscode.window.showWorkspaceFolderPick({ placeHolder: "Choose workspace folder" });
    if (!workspaceFolder) {
      return await vscode.window.showErrorMessage("You need to select a workspace folder");
    }

    if (workspaceFolder.uri.scheme !== "file") {
      return await vscode.window.showErrorMessage("Workspace folder needs to use the file:/// uri scheme.");
    }

    let index = indexLocator.getIndexForWorkspaceFolder(workspaceFolder);

    try {
      let dot = await runTerraform(workspaceFolder, ["graph", "-draw-cycles", `-type=${type}`, "."], { reportMetric: true });

      let processedDot = replaceNodesWithLinks(index, dot);

      // make background transparent
      processedDot = processedDot.replace('digraph {\n', 'digraph {\n  bgcolor="transparent";\n');

      this.provider.update(processedDot, type, workspaceFolder.name);

      await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
    } catch (error) {
      this.logger.error('Generating graph preview failed:');
      let lines = error.split(/[\r?\n]+/);
      for (let line of lines)
        this.logger.error('\t' + line);
      await vscode.window.showErrorMessage(`Error generating graph, see output view.`);
    }
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