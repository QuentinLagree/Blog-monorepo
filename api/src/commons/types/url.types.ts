export class Url {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  static create(url: string): Url {
    const urlRegex: RegExp = new RegExp(
      '^\/[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)*$|^\/$',
    );

    if (typeof url !== 'string') {
      throw new Error("L'url doit être une chaîne de caractère.");
    }

    if (urlRegex.test(url)) {
      return new Url(url);
    }

    throw new Error("L'url est invalide.");
  }

  value(): string {
    return this.url;
  }
}
