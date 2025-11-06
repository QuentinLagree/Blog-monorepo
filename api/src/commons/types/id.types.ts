export class ID {
  private readonly id: number;

  constructor(id: number) {
    this.id = id;
  }

  public static add(id: number): ID {
    if (typeof id !== 'number') {
      throw new Error("L'id doit être un nombre.");
    }
    if (!Number.isInteger(id)) {
      throw new Error("L'id doit être un nombre entier.");
    }
    return new ID(id);
  }

  public value(): number {
    return this.id;
  }

  public static hasValid(id: number): Boolean {
    try {
      ID.add(id);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        return false;
      }
      return false;
    }
  }
}
