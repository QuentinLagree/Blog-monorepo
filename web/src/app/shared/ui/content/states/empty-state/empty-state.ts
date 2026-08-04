import { Component, input, InputSignal, output, OutputEmitterRef } from "@angular/core";
import { BaseButtonComponent, ButtonData } from "../../../form/buttons/base-button";

@Component({
  selector: 'app-state-empty',
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
  imports: [BaseButtonComponent],
})
export class EmptyStateComponent {
    title: InputSignal<string> = input.required()
    description: InputSignal<string> = input.required()

    primaryButton: InputSignal<ButtonData | undefined> = input()
  secondaryButton: InputSignal<ButtonData | undefined> = input()
  
  
  primaryAction: OutputEmitterRef<void> = output<void>();
  secondaryAction: OutputEmitterRef<void> = output<void>();

  doPrimaryAction() { this.primaryAction.emit() }
  doSecondaryAction() { this.secondaryAction.emit() }
}