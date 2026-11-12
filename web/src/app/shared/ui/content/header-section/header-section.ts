import { Component, input, InputSignal } from '@angular/core';

@Component({
  selector: 'app-header-section',
  standalone: true,
  template: `
    <div class="header-section">
      <div>
        <p class="header-section__eyebrow">{{ this.eyebrow() }}</p>
        <h2>{{ this.title() }}</h2>
      </div>
    </div>
  `,
  styleUrls: ['./header-section.scss']
})
export class HeaderSectionComponent {
  eyebrow: InputSignal<string> = input.required();
  title: InputSignal<string> = input.required();
}
