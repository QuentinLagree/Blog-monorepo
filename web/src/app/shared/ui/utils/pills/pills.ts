import { Component, EventEmitter, input, InputSignal, Output, output } from "@angular/core";

@Component({
    selector: 'app-pills',
    template: `<div  class="pill pill-primary"><span>{{ value() }} </span><ng-content></ng-content></div>`,
    styleUrls: ['./pills.scss']
})
export class PillsComponent {
    value: InputSignal<string> = input.required<string>()
}