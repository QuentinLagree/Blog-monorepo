import { Component, input, InputSignal, } from "@angular/core";

@Component({
  selector: 'app-landing-loading',
  templateUrl: './page-landing-loading.html',
  styleUrls: ['./page-landing-loading.scss'],
})
export class PageLandingLoadingComposent {
    eyebrow: InputSignal<string> = input.required()
    title: InputSignal<string> = input.required()
    description: InputSignal<string> = input.required()
}