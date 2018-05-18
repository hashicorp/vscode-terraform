import * as vscode from 'vscode';
import { QueryOptions, Section } from './section';

export interface ReferenceQueryOptions {
  target?: string | Section;
  position?: vscode.Position;
}

export class Reference {
  readonly type: string;
  readonly parts: string[];
  nameRange: vscode.Range; // only for .tfvars assignments
  readonly location: vscode.Location;
  readonly targetId: string;
  readonly section: Section; // in .tfvars files this is null

  constructor(expr: string, location: vscode.Location, section: Section) {
    let parts = expr.split('.');

    this.type = (parts[0] === "var") ? "variable" : parts[0];
    this.parts = parts.slice(1);

    this.location = location;
    this.section = section;

    if (this.type === "variable") {
      this.targetId = `var.${this.parts[0]}`;
    } else if (this.type === "data") {
      this.targetId = `data.${this.parts[0]}.${this.parts[1]}`;
    } else {
      this.targetId = `${this.type}.${this.parts[0]}`;
    }
  }

  match(options?: ReferenceQueryOptions): boolean {
    if (!options)
      return true;

    if (options.target) {
      let targetId = options.target instanceof Section ? options.target.id() : options.target;
      if (targetId !== this.targetId)
        return false;
    }

    if (options.position && !this.location.range.contains(options.position)) {
      return false;
    }

    return true;
  }

  getQuery(): QueryOptions {
    if (this.type === "variable") {
      return {
        section_type: this.type,
        name: this.parts[0]
      }
    }

    if (this.type === "data") {
      return {
        section_type: this.type,
        type: this.parts[0],
        name: this.parts[1]
      }
    }

    if (this.type === "module") {
      // TODO: actually parse modules correctly, which will also
      //   allow us to handle these references correctly
      return {
        section_type: this.type,
        name: this.parts[0]
      }
    }

    if (this.type === "local") {
      return {
        section_type: "local",
        name: this.parts[0]
      }
    }

    // assume resource
    return {
      section_type: "resource",
      type: this.type,
      name: this.parts[0]
    }
  }

  valuePath(): string[] {
    if (this.type === "data") {
      return this.parts.slice(2);
    }

    return this.parts.slice(1);
  }
}
