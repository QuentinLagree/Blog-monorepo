import { Component, input, InputSignal, signal } from "@angular/core";

@Component({
  selector: 'app-header-content',
  standalone: true,
  template: `
  <header class="header-content">
    <div class="header-content__content">
      <p class="header-content__eyebrow">{{ this.eyebrow() }}</p>

      <h1>{{ this.title() }}</h1>

      <p class="header-content__baseline">
        {{ this.baseline() }}
      </p>
    </div>
    <div class="header-content__actions">
      <ng-content></ng-content>
    </div>
  </header>
  `,
  styleUrls: ['./header-content.scss'],
})
export class HeaderContentComponent {
  eyebrow: InputSignal<String> = input.required()
  title: InputSignal<String> = input.required()
  baseline: InputSignal<String> = input.required()
}