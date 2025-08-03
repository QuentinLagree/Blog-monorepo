import { Component, EventEmitter, HostBinding, input, InputSignal, Output } from "@angular/core";
import { FormGroup } from "@angular/forms";

export type ButtonType = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outlined';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-button',
    templateUrl: "./base-button.html",
    styleUrl: "./base-button.scss"
})

export class BaseButtonComponent {

    @Output() clicked: EventEmitter<void> = new EventEmitter<void>();

    type: InputSignal<ButtonType> = input<ButtonType>('primary');
    size: InputSignal<ButtonSize> = input<ButtonSize>('md');
    label: InputSignal<string> = input.required<string>();
    icon: InputSignal<string | undefined> = input<string | undefined>(undefined);
    disabled: InputSignal<boolean> = input<boolean>(false);
    loading: InputSignal<boolean> = input<boolean>(false);

    @HostBinding('class')
    get hostClasses() {
        return `btn-${this.type()} ${this.size()}`
    }
    
    onClick () {
        if (this.disabled() || this.loading()) return;
        this.clicked.emit();
    }
}