import { Injectable } from '@angular/core';
import Prism from 'prismjs';

@Injectable({ providedIn: 'root' })
export class PrismHighlightService {
  private scheduled = false;

  highlightPreview(host: HTMLElement | null | undefined) {
    if (!host) return;
    if (this.scheduled) return;

    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      host.querySelectorAll('code[class*="language-"]').forEach((el) => {
        Prism.highlightElement(el as HTMLElement);
      });
    });
  }
}
