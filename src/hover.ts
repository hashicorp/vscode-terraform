import * as vscode from 'vscode';
import { WorkspaceIndex, Section } from './index';
import { findValue, getStringValue, getValue } from './index/ast';

export class HoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let reference = WorkspaceIndex.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = WorkspaceIndex.query("ALL_FILES", reference.getQuery())[0];
    if (section.sectionType !== "variable")
      return null;

    let defaultValueNode = findValue(section.node, "default");
    if (!defaultValueNode)
      return new vscode.Hover("no default specified", reference.location.range);

    let type = getStringValue(findValue(section.node, "type"), "string");
    let defaultString = "";
    switch (type) {
      case "string":
        defaultString = getStringValue(defaultValueNode, "<failed to extract value>", { stripQuotes: true });
        defaultString = `default: \`${defaultString}\``;
        break;

      case "list":
        let list = getValue(defaultValueNode, { stripQuotes: true }) as string[];
        if (list.length === 0)
          defaultString = "default: *empty list*";
        else
          defaultString = "default:\n" + list.map((i) => ` - \`${i}\``).join("\n");
        break;

      case "map":
        let map = getValue(defaultValueNode, { stripQuotes: true }) as Map<string, string>;
        let pairs = [...map.entries()].map((v) => v.map((i) => `\`${i}\``).join(' = ')).map((i) => ` - ${i}`);
        if (pairs.length === 0)
          defaultString = "default: *empty map*";
        else
          defaultString = "default:\n" + pairs.join("\n");
        break;
    }

    return new vscode.Hover(new vscode.MarkdownString(defaultString), reference.location.range);
  }
}