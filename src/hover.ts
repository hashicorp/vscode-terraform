import * as vscode from 'vscode';
import { findValue } from './index/ast';
import { valueToMarkdown } from './index/ast-helpers';
import { IndexAdapter } from './index/index-adapter';
import { from_vscode_Position, to_vscode_Range } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class HoverProvider implements vscode.HoverProvider {
  private logger = new Logger("hover-provider");

  constructor(private index: IndexAdapter) { }

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    try {
      let [file, group] = this.index.indexDocument(document);
      if (!file || !group)
        return null;

      let reference = group.queryReferences(document.uri, { position: from_vscode_Position(position) })[0];
      if (!reference)
        return null;

      let section = group.query("ALL_FILES", reference.getQuery())[0];
      if (!section)
        return new vscode.Hover(new vscode.MarkdownString(`Unknown target \`${reference.targetId}\``), to_vscode_Range(reference.location.range));

      let valuePath = reference.valuePath();
      let label = valuePath[0];
      if (section.sectionType === "variable") {
        valuePath = ["default"];
        label = valuePath[0];
      } else if (section.sectionType === "local") {
        valuePath = [null];
        label = section.name;
      } else {
        // we need an attribute to read and it cannot be a splat
        if (valuePath.length === 0 || valuePath[0] === "*") {
          return null;
        }
      }

      // for now only support single level value extraction
      let valueNode = findValue(section.node, valuePath[0]);
      if (!valueNode)
        return new vscode.Hover(`\`${label}\` not specified`, to_vscode_Range(reference.location.range));

      let formattedString = `${label}: ${valueToMarkdown(valueNode, 0)}`;

      return new vscode.Hover(new vscode.MarkdownString(formattedString), to_vscode_Range(reference.location.range));
    } catch (error) {
      this.logger.exception("Could not provide hover", error);
      Reporter.trackException("provideHover", error);
    }
  }
}