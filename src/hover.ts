import * as vscode from 'vscode';
import { Index } from './index';
import { AstList, findValue, getStringValue, getValue } from './index/ast';
import { IndexLocator } from './index/index-locator';

export class HoverProvider implements vscode.HoverProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let index = this.indexLocator.getIndexForDoc(document);
    let reference = index.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = index.query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return new vscode.Hover(new vscode.MarkdownString(`Unknown target \`${reference.targetId}\``), reference.location.range);

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
      return new vscode.Hover(`\`${label}\` not specified`, reference.location.range);

    let formattedString = "";

    // guess type (ignore type= key because it might be missing anyway)
    if (valueNode.List && (valueNode.List as AstList).Items) {
      // map
      let map = getValue(valueNode, { stripQuotes: true }) as Map<string, string>;
      let pairs = [...map.entries()].map((v) => v.map((i) => `\`${i}\``).join(' = ')).map((i) => ` - ${i}`);
      if (pairs.length === 0)
        formattedString = `${label}: *empty map*`;
      else
        formattedString = `${label}:\n` + pairs.join("\n");
    } else if (valueNode.List) {
      // list
      let list = getValue(valueNode, { stripQuotes: true }) as string[];
      if (list.length === 0)
        formattedString = `${label}: *empty list*`;
      else
        formattedString = `${label}:\n` + list.map((i, idx) => `${idx}. \`${i}\``).join("\n");
    } else {
      // string
      formattedString = getStringValue(valueNode, "<failed to extract value>", { stripQuotes: true });
      formattedString = `${label}: \`${formattedString}\``;
    }

    return new vscode.Hover(new vscode.MarkdownString(formattedString), reference.location.range);
  }
}