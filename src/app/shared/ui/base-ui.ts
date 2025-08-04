import { Component } from "@angular/core";
import { BaseButtonComponent } from "./form/buttons/base-button";

@Component({
    selector: "app-generic-ui",
    templateUrl: './base-ui.html',
    imports: [BaseButtonComponent]
})
export class UIComponent {}