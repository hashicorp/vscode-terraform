import * as vscode from 'vscode';
import { AstItem, getMapValue } from './ast';
import { Reference } from "./reference";

function getKind(sectionType: string): vscode.SymbolKind {
  switch (sectionType) {
    case "resource": return vscode.SymbolKind.Interface;
    case "output": return vscode.SymbolKind.Property;
    case "variable": return vscode.SymbolKind.Variable;
    case "local": return vscode.SymbolKind.Variable;
  }

  return null;
}

export interface QueryOptions {
  name?: string;
  section_type?: string;
  type?: string;
  name_position?: vscode.Position;
  position?: vscode.Position;
  id?: string;
}

export class Section extends vscode.SymbolInformation {
  references: Reference[] = [];

  // variable, resource or data (for example)
  readonly sectionType: string;

  // optional: but might for example be "aws_s3_bucket"
  readonly type?: string;
  readonly typeLocation?: vscode.Location;
  readonly name: string;
  readonly nameLocation: vscode.Location;
  readonly location: vscode.Location;
  readonly node: AstItem;

  readonly attributes: Map<string, string>;

  constructor(
    sectionType: string,
    type: string | null,
    typeLocation: vscode.Location | null,
    name: string,
    nameLocation: vscode.Location,
    location: vscode.Location,
    node: AstItem) {
    super(name, getKind(sectionType), [sectionType, type].filter((f) => !!f).join("."), location)

    this.sectionType = sectionType;
    this.type = type;
    this.typeLocation = typeLocation;
    this.name = name;
    this.nameLocation = nameLocation;
    this.location = location;
    this.node = node;

    if (node)
      this.attributes = getMapValue(node.Val, { stripQuotes: true });
    else
      this.attributes = new Map<string, string>();
  }

  match(options?: QueryOptions): boolean {
    if (!options)
      return true;

    if (options.id && !this.id().match(options.id))
      return false;

    if (options.section_type && this.sectionType !== options.section_type)
      return false;

    if (this.type) {
      if (options.type && !this.type.match(options.type))
        return false;
    } else {
      if (options.type)
        return false;
    }

    if (options.name && !this.name.match(options.name))
      return false;

    if (options.name_position && !this.nameLocation.range.contains(options.name_position))
      return false;

    if (options.position && !this.location.range.contains(options.position))
      return false;

    return true;
  }

  id(rename?: string): string {
    let name = rename || this.name;

    if (this.sectionType === "variable") {
      return `var.${name}`;
    }
    if (this.sectionType === "local") {
      return `local.${name}`;
    }

    if (this.sectionType === "data")
      return [this.sectionType, this.type, name].join(".");

    if (this.sectionType === "output")
      return this.name;

    return [this.type, name].join(".");
  }
}