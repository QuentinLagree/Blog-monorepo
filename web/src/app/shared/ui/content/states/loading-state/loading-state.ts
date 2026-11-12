import { Component, input, InputSignal } from '@angular/core';

@Component({
  selector: 'app-state-loading',
  templateUrl: './loading-state.html',
  styleUrls: ['./loading-state.scss']
})
export class LoadingStateComponent {
  title: InputSignal<string> = input.required();
}
