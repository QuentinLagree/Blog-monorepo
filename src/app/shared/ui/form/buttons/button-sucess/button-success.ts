import { Component, input, InputSignal } from "@angular/core";
import { BaseButtonComponent, ButtonSize, ButtonType } from "../base-button";

@Component({
    selector: 'app-button-success',
    templateUrl: '../base-button-simple.html',
    styleUrls: ['../base-button.scss']
})
export class SuccessButtonComponent extends BaseButtonComponent {
    override type: InputSignal<ButtonType> = input<ButtonType>('success');
    override size: InputSignal<ButtonSize> = input<ButtonSize>('sm');
    override label: InputSignal<string> = input<string>('Valider');
}