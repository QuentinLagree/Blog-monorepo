import { Component, input, InputSignal } from "@angular/core";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";

type ElementsType =
  | 'preference'
  | 'article'




@Component({
  selector: 'app-profil-header-section',
  standalone: true,
  imports: [
    BaseButtonComponent
  ],
  templateUrl: './profil-header-section.html',
  styleUrls: ['./profil-header-section.scss', '../profil-collapse.scss'],
})

export class ProfilHeaderSectionComponent {

  readonly eyebrow: InputSignal<string> = input.required();
  readonly title: InputSignal<string> = input.required();
  readonly description: InputSignal<string> = input.required();
  readonly element: InputSignal<ElementsType> = input.required()

  ElementsDisplay = {
    article: 'article',
    preference: 'préférence'
  }
  showElements: boolean = false;

}