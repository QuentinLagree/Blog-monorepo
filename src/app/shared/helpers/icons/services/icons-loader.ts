import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IconLoaderService {
  constructor() {
    this.injectIcons();
  }

  injectIcons() {
    fetch('/assets/icons/icons.svg')
      .then((res) => res.text())
      .then((svg) => {
        const div = document.createElement('div');
        div.style.display = 'none';
        div.innerHTML = svg;
        document.body.insertBefore(div, document.body.firstChild);
      });
  }
}
