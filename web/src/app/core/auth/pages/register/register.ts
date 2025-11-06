import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputValidatorFactory } from 'src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory';
import { PasswordInputValidatorFactory } from 'src/app/shared/ui/form/inputs/inputs-password/validators/input-password-validator.factory';
import { BaseButtonComponent } from "@src/app/shared/ui/form/buttons/base-button";
import { TextInputValidatorFactory } from '@src/app/shared/ui/form/inputs/input/validators/input-text-validator.factory';
import { EmailInputComponent } from "@src/app/shared/ui/form/inputs/input-email/input-email";
import { InputComponent } from "@src/app/shared/ui/form/inputs/input/input";
import { InputPassswordComponent } from "@src/app/shared/ui/form/inputs/inputs-password/inputs-password";
import { Router } from '@angular/router';
import { UserService } from '@src/app/core/services/user.service';
import { userLogin } from '../../models/user-login.model';
import { userRegister } from '../../models/user-register.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    BaseButtonComponent,
    EmailInputComponent,
    InputComponent,
    InputPassswordComponent
],
  standalone: true,
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterPageComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _router: Router = inject(Router);
  private _user: UserService = inject(UserService)

  loading: boolean = false;


  firstnameControl = new FormControl('Lagree', [TextInputValidatorFactory({
    minlength: 3,
    options: {
        acceptSpecialCaracters: false,
    }
  })])

  lastnameControl = new FormControl('Quentin', [TextInputValidatorFactory({
    minlength: 3,
    options: {
        acceptSpecialCaracters: false,
    }
  })])

  pseudoControl = new FormControl('QuentinLa', [TextInputValidatorFactory({
    minlength: 3,
  })])


  emailControl = new FormControl('lagreequentindev21@gmail.com', [
    EmailInputValidatorFactory({
      minlength: 5,
    })
  ]);

  passwordControl = new FormControl('Salut1234!', [PasswordInputValidatorFactory()]);

  confirmPasswordControl = new FormControl('Salut1234!', [PasswordInputValidatorFactory({
    options: {
      hasSameValueOf: this.passwordControl
    }
  })]);

  form = this._formBuilder.group({
    firstname: this.firstnameControl,
    lastname: this.lastnameControl,
    pseudo: this.pseudoControl,
    email: this.emailControl,
    password: this.passwordControl,
    confirm_password: this.confirmPasswordControl,
  });

  submit = () => {
      if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.loading) return;
      
  
      const { firstname, lastname, pseudo , email, password } = this.form.getRawValue();
      let user: userRegister = {
        nom: firstname,
        prenom: lastname,
        pseudo: pseudo,
        email: email,
        password: '',
        role: 'user'
      };

      this.loading = true;
      
      setTimeout(() => {
        this._user.registerUser(user)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: () => {
            this._router.navigate(['auth/login'])
          },
        });
      }, 2000)
  };
}
