import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ContextMenuService } from './services/context-menu.service';

@Component({
  selector: 'app-context-menu',
  templateUrl: 'context-menu.html',
  styleUrls: ['context-menu.scss'],
})
export class ContextMenuComponent {
  @ViewChild('menu') menuRef?: ElementRef<HTMLElement>;

  visible = false;
  pos = { x: 0, y: 0 };
  data: any;
  action: Function = () => {}

  private clickPoint = { x: 0, y: 0 };

  constructor(private _contextmenu: ContextMenuService) {
    this._contextmenu.open$.subscribe(({ x, y, data, action }) => {
      this.clickPoint = { x, y };
      this.pos = { x, y };
      this.data = data;

      this.action = action;
      this.visible = true;

      setTimeout(() => this.reposition(), 0);
    });
  }

  private reposition() {
    const element = this.menuRef?.nativeElement;
    if (!element) return;

    console.log('reposition OK');

    const menuW = element.offsetWidth;
    const menuH = element.offsetHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = this.clickPoint.x;
    if (x + menuW > vw) x = Math.max(0, vw - menuW);

    let y = this.clickPoint.y;
    if (y + menuH > vh) y = Math.max(0, this.clickPoint.y - menuH);

    this.pos = { x, y };
  }

  @HostListener('document:click')
  closeOnClick() {
    this.visible = false;
  }

  @HostListener('document:scroll')
  closeOnSroll() {
    this.visible = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEscapeKey() {
    this.visible = false;
  }

  onSelect(optionName: string) {
    this.action(this.data, optionName)
    this.visible = false
  }

  getAllOptions() { return this._contextmenu.options }
}
