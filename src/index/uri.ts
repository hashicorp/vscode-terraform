export class Uri {
  private constructor(private uri: string) { }

  public static parse(uri: string): Uri {
    return new Uri(uri);
  }

  public toString(): string {
    return this.uri;
  }

  public dirname(): string {
    let i = this.uri.lastIndexOf('/');
    if (i === -1) {
      i = this.uri.lastIndexOf('\\');
    }
    if (i === -1) {
      return "";
    }

    return this.uri.substr(0, i);
  }
}