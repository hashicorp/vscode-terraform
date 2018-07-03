export class Uri {
  private constructor(private uri: string) { }

  public static parse(uri: string): Uri {
    return new Uri(uri);
  }

  public toString(): string {
    return this.uri;
  }
}