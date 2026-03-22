import { AfterViewInit, Component, HostListener, inject, signal, Signal, WritableSignal } from '@angular/core';
import { BaseButtonComponent } from './form/buttons/base-button';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextInputValidatorFactory } from './form/inputs/input/validators/input-text-validator.factory';
import { SelectComponent } from './form/selects/selects';
import { MutliSelectValidatorFactory } from './form/selects/models/multi-select-validator.factory';
import { SwitchButtonComponent } from './form/switch-button/switch-button';
import { InputPassswordComponent } from './form/inputs/inputs-password/inputs-password';
import { ToastService } from '@src/app/core/toasts/toaster.service';
import { SubmitButtonComponent } from "./form/buttons/button-submit/button-submit";
import { SelectValidatorFactory } from './form/selects/models/select-validator.factory';
import { PostCard } from "./card/post-card/post-card";
import { Post } from '@src/app/core/services/post.service';
import { TextAreaValidatorFactory } from './form/text-area/validators/textarea-validator.factory';
import { TextAreaComponent } from "./form/text-area/text-area";
import { ContextMenuComponent } from "./context-menu/context-menu";
import { ContextMenuTriggerDirective } from "./context-menu/context-menu.directive";
import { MarkdownSyntaxOptions } from './context-menu/config/context-menu-options';
import { EditButtonComponent } from "./form/buttons/button-edit/button-edit";
import { DangerButtonComponent } from "./form/buttons/button-danger/button-danger";

@Component({
  selector: 'app-generic-ui',
  templateUrl: './base-ui.html',
  styles: "@use 'base' as *;",
  imports: [
    BaseButtonComponent,
    ReactiveFormsModule,
    SelectComponent,
    SwitchButtonComponent,
    InputPassswordComponent,
    SubmitButtonComponent,
    PostCard,
    TextAreaComponent,
    ContextMenuTriggerDirective,
    EditButtonComponent,
    DangerButtonComponent
]
})
export class UIComponent implements AfterViewInit {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _toastService: ToastService = inject(ToastService);
  syntaxChoice: WritableSignal<string> = signal("Aucun choix")
  options = MarkdownSyntaxOptions

  
  exemplePost: Signal<Post> = signal({
    id: 1,
    authorId: 1,
    title: 'Premier post',
    content: 'Ceci est le contenu de mon premier post.',
    description: "Ceci est une description de la publication",
    published: true,
    created_at: new Date(Date.now())
  });
  
  textControl = new FormControl('', [
    TextInputValidatorFactory({
      validate: false,
      required: false
    })
  ]);
  selectControl = new FormControl('', [
    SelectValidatorFactory({
      validate: false,
      required: false,
    })
  ]);
  selectMultipleControl = new FormControl('', [
    MutliSelectValidatorFactory({
      validate: false,
      required: false,
      maxlength: 2
    })
  ]);
  checkboxControl = new FormControl(false);

  textareaControl = new FormControl('', [TextAreaValidatorFactory({
    validate: false,
    required: false
  })])

  form = this._formBuilder.group({
    text: this.textControl,
    select: this.selectControl,
    checkbox: this.checkboxControl
  });

  @HostListener('window:scroll')
  onScroll(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  @HostListener('window:beforeunload')
  beforeUnloadHandler(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  actionHandle = (_data: any, syntaxName: string) => {
  this.syntaxChoice.set(syntaxName);
};

  ngAfterViewInit(): void {
    this._toastService.error("Un problème s'est déroulé lors de la connection.", {
      duration: 1000000
    });
    setTimeout(() => {
      const savedScroll = localStorage.getItem('scrollY');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    }, 50);
  }
}
