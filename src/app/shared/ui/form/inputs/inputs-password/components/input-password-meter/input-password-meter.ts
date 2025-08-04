import { Component, effect, input, InputSignal, signal } from "@angular/core";

export type stateMeter = "Faible" | "Moyen" | "Fort" | "Très Fort";


@Component({
    selector: 'app-input-password-meter',
    template: `
    <p>
  Force : <strong [style.color]="strengthColor()">{{ strength() }}</strong>
</p>
`,
    styleUrls: ['./input-password-meter.scss']
})
export class InputPasswordMeterComponent {

    value: InputSignal<string> = input.required<string>();

    strength = signal<'Faible' | 'Moyen' | 'Fort' | 'Très Fort'>('Faible');
    strengthColor = signal<"#6de969ff" | "#b8e969ff" | "#e98d69ff" | "#f35f5fff">("#6de969ff");

    constructor() {
        effect(() => {
            const val = this.value();
            let errorsCount = 0;

            if (val.length < 8) errorsCount++;
            if (!/[A-Z]/.test(val)) errorsCount++;
            if (!/[!@#$%^&*)(+=._-]/.test(val)) errorsCount++;
            if (!/[0-9]/.test(val)) errorsCount++;

            // Interprétation du résultat
            if (errorsCount === 0) {
                this.strength.set('Très Fort');
                this.strengthColor.set('#f35f5fff');
            } else if (errorsCount === 1) {
                this.strength.set('Fort');
                this.strengthColor.set('#e98d69ff');
            } else if (errorsCount === 2) {
                this.strength.set('Moyen');
                this.strengthColor.set('#b8e969ff');
            } else {
                this.strength.set('Faible');
                this.strengthColor.set('#6de969ff');
            }
        });
    }

}