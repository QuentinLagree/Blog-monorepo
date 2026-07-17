import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from 'src/app/shared/ui/form/inputs/input-email/input-email';
import { EmailInputValidatorFactory } from 'src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory';
import { InputPassswordComponent } from 'src/app/shared/ui/form/inputs/inputs-password/inputs-password';
import { PasswordInputValidatorFactory } from 'src/app/shared/ui/form/inputs/inputs-password/validators/input-password-validator.factory';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { UserService } from 'src/app/shared/services/user.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from 'src/app/shared/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, EmailInputComponent, InputPassswordComponent, BaseButtonComponent],
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginPageComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _router: Router = inject(Router);
  private _user: UserService = inject(UserService);
  private _session: SessionService = inject(SessionService)

  loading = false;

  readonly prod: boolean = environment.production;

  emailControl = new FormControl('', [
    EmailInputValidatorFactory({
      minlength: 5
    })
  ]);

  passwordControl = new FormControl('', [
    PasswordInputValidatorFactory({
      validate: false,
      options: {
        useStrengthCheck: false
      }
    })
  ]);

  form = this._formBuilder.group({
    email: this.emailControl,
    password: this.passwordControl
  });

  submit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading) return;

    this.loading = true;

    const { email, password } = this.form.getRawValue();

    setTimeout(() => {
      this._user
        .loginUser({ email, password })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (response) => {
            this._session.setSession(response.data)
            this._router.navigate([''])
          }
        });
    }, 2000);
  };

  setFormWithMode(mode: 'admin' | 'user') {
    let data = {
      admin: ['lagreequentindev21@gmail.com', 'Salut1234!'],
      user: ['johhdoe@gmail.com', 'Salut1234!']
    }

    this.emailControl.setValue(data[mode][0])
    this.passwordControl.setValue(data[mode][1])
    
  }
}
