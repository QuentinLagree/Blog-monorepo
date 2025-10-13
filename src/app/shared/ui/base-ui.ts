import { AfterViewInit, Component, HostListener, inject } from '@angular/core';
import { BaseButtonComponent } from './form/buttons/base-button';
import { InputComponent } from './form/inputs/input/input';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextInputValidatorFactory } from './form/inputs/input/validators/input-text-validator.factory';
import { SelectComponent } from './form/selects/selects';
import { MutliSelectValidatorFactory } from './form/selects/models/multi-select-validator.factory';
import { SwitchButtonComponent } from "./form/switch-button/switch-button";
import { InputPassswordComponent } from "./form/inputs/inputs-password/inputs-password";
import { ToastService } from '@src/app/core/toasts/toaster.service';

@Component({
  selector: 'app-generic-ui',
  templateUrl: './base-ui.html',
  styles: "@use 'base' as *;",
  imports: [
    BaseButtonComponent,
    ReactiveFormsModule,
    SelectComponent,
    SwitchButtonComponent,
    InputPassswordComponent
]
})
export class UIComponent implements AfterViewInit {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _toastService: ToastService = inject(ToastService);

  textControl = new FormControl('', [TextInputValidatorFactory({
    validate: false,
    required: false
  })]);
  selectControl = new FormControl('', [MutliSelectValidatorFactory({
    validate: false,
    required: false
  })]);
  checkboxControl = new FormControl(false);
  
  form = this._formBuilder.group({
    text: this.textControl,
    select: this.selectControl,
    checkbox: this.checkboxControl
  });

  @HostListener('window:scroll')
  onScroll(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  ngAfterViewInit(): void {
      this._toastService.error("Un problème s'est déroulé lors de la connection.", {sticky: true})
      this._toastService.error("Un problème s'est déroulé lors de la connection.", {sticky: true})
    setTimeout(() => {
      const savedScroll = localStorage.getItem('scrollY');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    }, 50);
  }
}
