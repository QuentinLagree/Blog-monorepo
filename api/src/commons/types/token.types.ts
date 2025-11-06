export class TOKEN {
  private token: string;

  static EXPIRED_TOKEN = 3 * 60 * 60 * 1000;

  constructor(token: string) {
    this.token = token;
  }

  public static add(token: string) {
    if (!new RegExp('[0-9a-fA-F]{32}').test(token)) {
      throw new Error('Le token doit être du format Hexadécimal.');
    }
    return new TOKEN(token);
  }

  get getToken() {
    return this.token;
  }

  public static hasValid(token: string): Boolean {
    try {
      TOKEN.add(token);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        return false;
      }
      return false;
    }
  }
}
