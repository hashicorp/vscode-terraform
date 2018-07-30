import { AstItem } from './ast';
import { Location } from './location';
import { Position } from './position';
import { Property } from './property';
import { Reference } from "./reference";

export interface QueryOptions {
  name?: string;
  section_type?: string;
  type?: string;
  name_position?: Position;
  position?: Position;
  id?: string | { type: "FUZZY" | "PREFIX", match: string };
  unique?: boolean;
}

export class Section {
  references: Reference[] = [];

  // variable, resource or data (for example)
  readonly sectionType: string;

  // optional: but might for example be "aws_s3_bucket"
  readonly type?: string;
  readonly typeLocation?: Location;
  readonly name: string;
  readonly nameLocation: Location;
  readonly location: Location;
  readonly node: AstItem;

  private rootProperty: Property;

  get properties(): Property[] {
    return this.rootProperty.value as Property[];
  }

  get label(): string {
    return [this.type, this.name].filter(n => !!n).join('.');
  }

  constructor(
    sectionType: string,
    type: string | null,
    typeLocation: Location | null,
    name: string,
    nameLocation: Location,
    location: Location,
    node: AstItem,
    properties: Property[]
  ) {

    this.sectionType = sectionType;
    this.type = type;
    this.typeLocation = typeLocation;
    this.name = name;
    this.nameLocation = nameLocation;
    this.location = location;
    this.node = node;

    this.rootProperty = new Property(null, null, properties, null, null);
  }

  getProperty(...name: string[]): Property | null {
    return this.rootProperty.getProperty(...name);
  }

  getStringProperty(name: string, defaultValue: string = ""): string {
    const p = this.getProperty(name);
    if (!p)
      return defaultValue;
    return p.toString();
  }

  match(options?: QueryOptions): boolean {
    if (!options)
      return true;

    if (options.id) {
      if (typeof options.id === "string") {
        // exact match
        if (this.id() !== options.id)
          return false;
      } else {
        switch (options.id.type) {
          case "FUZZY":
            if (this.id().indexOf(options.id.match) === -1)
              return false;
            break;
          case "PREFIX":
            if (this.id().indexOf(options.id.match) !== 0)
              return false;
            break;
        }
      }
    }

    if (options.section_type && this.sectionType !== options.section_type)
      return false;

    if (this.type) {
      if (options.type && this.type.indexOf(options.type) === -1)
        return false;
    } else {
      if (options.type)
        return false;
    }

    if (options.name && this.name.indexOf(options.name) === -1)
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

    return [this.type, name].filter(f => !!f).join(".");
  }
}