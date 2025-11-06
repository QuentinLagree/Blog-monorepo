export function setIsOpenOutFocus(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    const root = e.currentTarget as HTMLElement;

    if (next && root.contains(next)) return;

    return false;
  }