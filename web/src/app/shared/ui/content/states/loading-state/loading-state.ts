import { Component, input, InputSignal, output, OutputEmitterRef } from "@angular/core";
import { BaseButtonComponent, ButtonData } from "../../../form/buttons/base-button";

@Component({
  selector: 'app-state-loading',
  templateUrl: './loading-state.html',
  styleUrls: ['./loading-state.scss'],
})
export class LoadingStateComponent {
  title: InputSignal<string> = input.required()
}