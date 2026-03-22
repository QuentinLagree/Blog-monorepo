import { Directive, HostListener, Input } from '@angular/core';
import { ContextMenuService } from './services/context-menu.service';

@Directive({
  selector: '[contextMenuTrigger]'
})
export class ContextMenuTriggerDirective {
  @Input('contextMenuTrigger') data: any;
  @Input() contextMenuAction!: (data: any, optionName: string) => void;

  constructor(private contextMenu: ContextMenuService) {}

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
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
