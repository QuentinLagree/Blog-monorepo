import { AfterViewInit, Component, HostListener, inject } from '@angular/core';
import { BaseButtonComponent } from './form/buttons/base-button';
import { InputComponent } from './form/inputs/input/input';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextInputValidatorFactory } from './form/inputs/input/validators/input-text-validator.factory';
import { InputPassswordComponent } from './form/inputs/inputs-password/inputs-password';
import { PasswordInputValidatorFactory } from './form/inputs/inputs-password/validators/input-password-validator.factory';
import { EmailInputComponent } from './form/inputs/input-email/input-email';
import { EmailInputValidatorFactory } from './form/inputs/input-email/validators/input-email-validator.factory';
import { SelectComponent } from './form/selects/selects';
import { SelectValidatorFactory } from './form/selects/models/select-validator.factory';

@Component({
  selector: 'app-generic-ui',
  templateUrl: './base-ui.html',
  imports: [
    BaseButtonComponent,
    InputComponent,
    ReactiveFormsModule,
    InputPassswordComponent,
    EmailInputComponent,
    SelectComponent
  ]
})
export class UIComponent implements AfterViewInit {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);

  textControl = new FormControl('', [TextInputValidatorFactory()]);
  passwordControl = new FormControl('', [PasswordInputValidatorFactory()]);
  emailControl = new FormControl('', [EmailInputValidatorFactory()]);
  selectControl = new FormControl('', [SelectValidatorFactory()]);

  form = this._formBuilder.group({
    username: this.textControl,
    password: this.passwordControl,
    email: this.emailControl
  });

  @HostListener('window:scroll')
  onScroll(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  // Pour certaines plateformes, on ajoute aussi beforeunload
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(): void {
    localStorage.setItem('scrollY', window.scrollY.toString());
  }

  ngAfterViewInit(): void {
    // Retarde légèrement la restauration du scroll
    setTimeout(() => {
      const savedScroll = localStorage.getItem('scrollY');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    }, 50); // ou plus si le DOM est long à se charger
  }
}
