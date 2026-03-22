import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MarkdownSyntaxOptions } from '../config/context-menu-options';

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
    options = MarkdownSyntaxOptions
  private openSubject = new Subject<{
    x: number;
    y: number;
    data: any;
    action: (data: any, optionName: string) => void;
  }>();

  open$ = this.openSubject.asObservable();


  open(payload: {
    x: number;
    y: number;
    data: any;
    action: (data: any, optionName: string) => void;
  }) {
    this.openSubject.next(payload);
  }
}
