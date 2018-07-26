import * as vscode from "vscode";
import { GraphContentProvider, graphPreviewUri } from "../graph";
import { groupQuickPick } from "../group-quickpick";
import { IndexGroup } from "../index/group";
import { IndexAdapter } from "../index/index-adapter";
import { Section } from "../index/section";
import { Runner } from "../runner";
import { Command } from "./command";

const Dot = require('graphlib-dot');

export class PreviewGraphCommand extends Command {
  constructor(private provider: GraphContentProvider, private index: IndexAdapter, private runner: Runner) {
    super("preview-graph");
  }

  protected async perform(): Promise<any> {
    const types = ['plan', 'plan-destroy', 'apply',
      'validate', 'input', 'refresh'];
    let type = await vscode.window.showQuickPick(types, { placeHolder: "Choose graph type" });

    let group = await groupQuickPick(this.index.index);
    if (!group)
      return;

    try {
      let dot = await this.runner.run({
        cwd: group.uri.fsPath,
        reportMetric: true
      }, "graph", "-draw-cycles", `-type=${type}`, ".");

      let processedDot = this.replaceNodesWithLinks(group, dot);

      // make background transparent
      processedDot = processedDot.replace('digraph {\n', 'digraph {\n  bgcolor="transparent";\n');

      this.provider.update(processedDot, type, group);

      await vscode.commands.executeCommand('vscode.previewHtml', graphPreviewUri, vscode.ViewColumn.Active, 'Terraform Graph');
    } catch (error) {
      this.logger.error('Generating graph preview failed:');
      let lines = error.split(/[\r?\n]+/);
      for (let line of lines)
        this.logger.error('\t' + line);
      await vscode.window.showErrorMessage(`Error generating graph, see output view.`);
    }
  }

  private replaceNodesWithLinks(group: IndexGroup, dot: string): string {
    const regex = /(\[[a-z0-9 ]+\] )?([^ ]+)/;
    let graph = Dot.read(dot);

    let changedNodes = new Map<string, Section>();
    for (let node of graph.nodes()) {
      let targetId = node.match(regex)[2];

      let section = group.section(targetId);
      if (section) {
        changedNodes.set(node, section);
      }
    }

    for (let [node, section] of changedNodes) {
      graph.setNode(node, { href: `terraform-section:${section.id()}` });
    }

    return Dot.write(graph);
  }
}