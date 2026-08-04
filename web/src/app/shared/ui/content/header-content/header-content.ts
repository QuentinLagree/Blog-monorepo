import { Component, input, InputSignal, output, Output, OutputEmitterRef, signal } from "@angular/core";
import { BaseButtonComponent, ButtonData } from "../../form/buttons/base-button";


@Component({
  selector: 'app-header-content',
  standalone: true,
  template: `
  @let actions = this.primaryAction && this.secondaryAction;
  @let buttons = this.primaryButton() && this.secondaryButton();
  <header class="header-content">
    <div class="header-content__content">
      <p class="header-content__eyebrow">{{ this.eyebrow() }}</p>

      <h1>{{ this.title() }}</h1>

      <p class="header-content__baseline">
        {{ this.baseline() }}
      </p>
    </div>
    @if (actions && buttons) {
      <div class="header-content__actions">
      <div class="btn-group btn-group--wrap">
        <app-button
          [icon]="this.primaryButton()!.icon ?? ''"
          [label]="this.primaryButton()!.label"
          (clicked)="doPrimaryAction()">
        </app-button>

        <app-button
          type="secondary"
          [icon]="this.secondaryButton()!.icon ?? ''"
          [label]="this.secondaryButton()!.label"
          (clicked)="doSecondaryAction()">
        </app-button>
      </div>
    </div>
    }
  </header>
  `,
  styleUrls: ['./header-content.scss'],
  imports: [BaseButtonComponent],
})
export class HeaderContentComponent {
  eyebrow: InputSignal<String> = input.required()
  title: InputSignal<String> = input.required()
  baseline: InputSignal<String> = input.required()

  primaryButton: InputSignal<ButtonData | undefined> = input()
  secondaryButton: InputSignal<ButtonData | undefined> = input()
  
  
  primaryAction: OutputEmitterRef<void> = output<void>();
  secondaryAction: OutputEmitterRef<void> = output<void>();

  doPrimaryAction() { this.primaryAction.emit() }
  doSecondaryAction() { this.secondaryAction.emit() }
}