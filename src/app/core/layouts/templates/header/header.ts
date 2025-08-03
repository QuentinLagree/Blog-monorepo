import { Component, input, InputSignal } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  standalone: true,
})
export class HeaderComponent {
  title: InputSignal<string> = input.required<string>()
}
