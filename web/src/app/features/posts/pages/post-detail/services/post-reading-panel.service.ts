import {
  Injectable,
  signal,
} from '@angular/core';

const STORAGE_KEY =
  'post-detail-reading-panel-opened';

@Injectable()
export class PostReadingPanelService {
  readonly opened = signal(
    this.readInitialState(),
  );

  toggle(): void {
    this.setOpened(
      !this.opened(),
    );
  }

  open(): void {
    this.setOpened(true);
  }

  close(): void {
    this.setOpened(false);
  }

  private setOpened(
    opened: boolean,
  ): void {
    this.opened.set(opened);

    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      String(opened),
    );
  }

  private readInitialState(): boolean {
    if (
      typeof window === 'undefined'
    ) {
      return true;
    }

    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    return stored === null
      ? true
      : stored === 'true';
  }
}
