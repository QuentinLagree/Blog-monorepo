import { ContextMenuOption } from './types/context-menu-option';
import { Directive, HostListener, Input, inject } from '@angular/core';
import { ContextMenuService } from './services/context-menu.service';

@Directive({
  selector: '[contextMenuTrigger]'
})
export class ContextMenuTriggerDirective {
  @Input('contextMenuTrigger') data: ContextMenuOption[] | null = null;
  @Input() contextMenuAction: ((data: ContextMenuOption[], optionName: string) => void) | null =
    null;

  private readonly contextMenu = inject(ContextMenuService);

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    if (this.contextMenuAction && this.data) {
      event.preventDefault();
      event.stopPropagation();

      this.contextMenu.open({
        x: event.clientX,
        y: event.clientY,
        data: this.data,
        action: this.contextMenuAction
      });
    }
  }
}
