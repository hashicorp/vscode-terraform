import * as vscode from 'vscode';
import { Index } from './index';
import { AstList, findValue, getStringValue, getValue } from './index/ast';

export class HoverProvider implements vscode.HoverProvider {
  constructor(private index: Index) { }

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let reference = this.index.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = this.index.query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return new vscode.Hover(new vscode.MarkdownString(`Unknown target \`${reference.targetId}\``), reference.location.range);

    let valuePath = reference.valuePath();
    if (section.sectionType === "variable") {
      // valuePath should actually be empty for variables
      valuePath = ["default"];
    } else {
      // we need an attribute to read and it cannot be a splat
      if (valuePath.length === 0 || valuePath[0] === "*") {
        return null;
      }
    }

    // for now only support single level value extraction
    let valueNode = findValue(section.node, valuePath[0]);
    if (!valueNode)
      return new vscode.Hover(`\`${valuePath[0]}\` not specified`, reference.location.range);

    let formattedString = "";

    // guess type (ignore type= key because it might be missing anyway)
    if (valueNode.List && (valueNode.List as AstList).Items) {
      // map
      let map = getValue(valueNode, { stripQuotes: true }) as Map<string, string>;
      let pairs = [...map.entries()].map((v) => v.map((i) => `\`${i}\``).join(' = ')).map((i) => ` - ${i}`);
      if (pairs.length === 0)
        formattedString = `${valuePath[0]}: *empty map*`;
      else
        formattedString = `${valuePath[0]}:\n` + pairs.join("\n");
    } else if (valueNode.List) {
      // list
      let list = getValue(valueNode, { stripQuotes: true }) as string[];
      if (list.length === 0)
        formattedString = `${valuePath[0]}: *empty list*`;
      else
        formattedString = `${valuePath[0]}:\n` + list.map((i, idx) => `${idx}. \`${i}\``).join("\n");
    } else {
      // string
      formattedString = getStringValue(valueNode, "<failed to extract value>", { stripQuotes: true });
      formattedString = `${valuePath[0]}: \`${formattedString}\``;
    }

    return new vscode.Hover(new vscode.MarkdownString(formattedString), reference.location.range);
  }
}