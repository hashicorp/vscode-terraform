import { AstList, AstTokenItem, AstVal, AstValueType, getStringValue, getText, getValueType } from "./ast";

export function valueToMarkdown(value: AstVal, depth: number = 0): string {
  switch (getValueType(value)) {
    case AstValueType.Map:
      return mapToMarkdown(value, depth);

    case AstValueType.List:
      return listToMarkdown(value, depth);

    case AstValueType.String:
      return stringToMarkdown(value);
  }
}

function mapToMarkdown(value: AstVal, depth: number): string {
  const list = value.List as AstList;

  if (list.Items.length === 0) {
    return '*empty map*';
  }

  const lines = list.Items.map((item, index) => {
    const label = getText(item.Keys[0].Token, { stripQuotes: true });

    const prefix = "  ".repeat(depth) + `- ${label}:`;

    if (getValueType(item.Val) !== AstValueType.String) {
      return prefix + "\n" + valueToMarkdown(item.Val, depth + 1);
    } else {
      return prefix + " " + stringToMarkdown(item.Val);
    }
  });

  return lines.join("\n");
}

function listToMarkdown(value: AstVal, depth: number): string {
  const list = value.List as AstTokenItem[];

  if (list.length === 0) {
    return '*empty list*';
  }

  const lines = list.map((item, index) => {
    const v = getText(item.Token, { stripQuotes: true, fallback: '<failed to extract value>' });
    return "  ".repeat(depth) + `${index + 1}. \`${v}\``;
  });

  return lines.join("\n");
}

function stringToMarkdown(value: AstVal): string {
  let str = getStringValue(value, "<failed to extract value>", { stripQuotes: true });
  return "`" + str + "`";
}

