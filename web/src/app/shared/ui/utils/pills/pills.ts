import { Component, input, InputSignal } from '@angular/core';

@Component({
  selector: 'app-pills',
  template: `<button class="pill pill-primary">
    <span>{{ value() }} </span><ng-content></ng-content>
  </button>`,
  styleUrls: ['./pills.scss']
})
export class PillsComponent {
  value: InputSignal<string> = input.required<string>();
}
