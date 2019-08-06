import { AstItem } from "./ast";
import { Location } from "./location";

export class Property {
  constructor(
    readonly name: string,
    readonly nameLocation: Location,
    readonly value: string | Property[],
    readonly valueLocation: Location,
    readonly node: AstItem
  ) { }

  toString(defaultValue = ""): string {
    if (typeof this.value !== "string")
      return defaultValue;
    return this.value;
  }

  getProperty(...name: string[]): Property {
    if (name.length === 0)
      return null;
    return this.getPropertyRecursive(name[0], name.slice(1));
  }

  private getPropertyRecursive(first: string, remaining: string[]): Property {
    if (typeof this.value === "string")
      return null;

    const property = this.value.find(p => p.name === first);
    if (!property)
      return null;

    if (remaining.length === 0)
      return property;

    return property.getPropertyRecursive(remaining[0], remaining.slice(1));
  }
}