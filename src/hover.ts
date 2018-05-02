import * as vscode from 'vscode';
import { Section, Index } from './index';
import { findValue, getStringValue, getValue, AstList } from './index/ast';

export class HoverProvider implements vscode.HoverProvider {
  constructor(private index: Index) { }

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let reference = this.index.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = this.index.query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return new vscode.Hover(new vscode.MarkdownString(`Unknown target \`${reference.targetId}\``), reference.location.range);

    if (section.sectionType !== "variable")
      return null;

    let defaultValueNode = findValue(section.node, "default");
    if (!defaultValueNode)
      return new vscode.Hover("no default specified", reference.location.range);

    let defaultString = "";

    // guess type (ignore type= key because it might be missing anyway)
    if (defaultValueNode.List && (defaultValueNode.List as AstList).Items) {
      // map
      let map = getValue(defaultValueNode, { stripQuotes: true }) as Map<string, string>;
      let pairs = [...map.entries()].map((v) => v.map((i) => `\`${i}\``).join(' = ')).map((i) => ` - ${i}`);
      if (pairs.length === 0)
        defaultString = "default: *empty map*";
      else
        defaultString = "default:\n" + pairs.join("\n");
    } else if (defaultValueNode.List) {
      // list
      let list = getValue(defaultValueNode, { stripQuotes: true }) as string[];
      if (list.length === 0)
        defaultString = "default: *empty list*";
      else
        defaultString = "default:\n" + list.map((i, idx) => `${idx}. \`${i}\``).join("\n");
    } else {
      // string
      defaultString = getStringValue(defaultValueNode, "<failed to extract value>", { stripQuotes: true });
      defaultString = `default: \`${defaultString}\``;
    }

    return new vscode.Hover(new vscode.MarkdownString(defaultString), reference.location.range);
  }
}