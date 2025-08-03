import { Component } from "@angular/core";
import { BaseButtonComponent } from "./form/buttons/base-button";
import { SubmitButtonComponent } from "./form/buttons/button-submit/button-submit";
import { SuccessButtonComponent } from "./form/buttons/button-sucess/button-success";
import { DangerButtonComponent } from "./form/buttons/button-danger/button-danger";

@Component({
    selector: "generic-ui",
    templateUrl: './base-ui.html',
    imports: [BaseButtonComponent]
})
export class UIComponent {}