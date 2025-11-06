import { Component, effect, input, InputSignal, signal, WritableSignal } from '@angular/core';

type StrengthPassword = 'Faible' | 'Moyen' | 'Fort' | 'Trés Fort';
type StrengthPasswordColor = '#F34848' | '#f3b748ff' | '#c5f348ff' | '#56f348ff';

@Component({
  selector: 'app-password-checker',
  template: `<p [style.color]="color()">{{ strength() }}</p>`,
  styles: `
    p {
      margin-top: 0.4em;
      text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.349);
    }
  `
})
export class PasswordLabelComponent {
  minLength: InputSignal<number> = input<number>(6);

  value: InputSignal<string> = input<string>('');
  strength: WritableSignal<StrengthPassword> = signal<StrengthPassword>('Faible');
  color: WritableSignal<StrengthPasswordColor> = signal<StrengthPasswordColor>('#F34848');

  constructor() {
    effect(() => {
      let errors = 0;
      if (this.value().length < this.minLength()) {
        errors++;
      }

      if (!/[A-Z]/.test(this.value())) {
        errors++;
      }

      if (!/[a-z]/.test(this.value())) {
        errors++;
      }

      if (!/[!@#$%^&*)(+=._-]/.test(this.value())) {
        errors++;
      }

      if (!/[0-9]/.test(this.value())) {
        errors++;
      }

      if (errors == 0) {
        this.strength.set('Trés Fort');
        this.color.set('#56f348ff');
        return;
      }

      if (errors == 1 || errors == 2) {
        this.strength.set('Fort');
        this.color.set('#c5f348ff');
        return;
      }

      if (errors == 3 || errors == 4) {
        this.strength.set('Moyen');
        this.color.set('#f3b748ff');
        return;
      }

      if (errors == 5) {
        this.strength.set('Faible');
        this.color.set('#F34848');
        return;
      }
    });
  }
}
