import { Component, Input } from "@angular/core";
import { slideDown } from "src/app/shared/animations/eyeAnimation.animation";
import { InputPasswordConfig } from "../../models/input-password-config.model";

@Component({
    selector: 'app-input-password-toggle',
    templateUrl: './input-password-toggle.html',
    styleUrl: './input-password-toggle.scss',
    standalone: true,
    animations: [slideDown]
})

export class InputPasswordToggleComponent {

    @Input({ required: true }) config!: Partial<InputPasswordConfig>;

        @Input({ required: true })
        updateType!: (patch: Partial<InputPasswordConfig>) => void;

toggleType() {
    const newType = this.config.type === 'password' ? 'text' : 'password';
    
    this.updateType({
        type: newType,
    }); 
    
    }
}