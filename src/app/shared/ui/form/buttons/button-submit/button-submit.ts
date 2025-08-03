import { Component, input, InputSignal } from "@angular/core";
import { BaseButtonComponent, ButtonSize, ButtonType } from "../base-button";

@Component({
    selector: 'app-button-submit',
    templateUrl: '../base-button-simple.html',
    styleUrls: ['../base-button.scss']
})
export class SubmitButtonComponent extends BaseButtonComponent {
    override type: InputSignal<ButtonType> = input<ButtonType>('primary');
    override size: InputSignal<ButtonSize> = input<ButtonSize>('lg');
    override label: InputSignal<string> = input<string>('Envoyer');
}