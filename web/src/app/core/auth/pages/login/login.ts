import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from 'src/app/shared/ui/form/inputs/input-email/input-email';
import { EmailInputValidatorFactory } from 'src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory';
import { InputPassswordComponent } from 'src/app/shared/ui/form/inputs/inputs-password/inputs-password';
import { PasswordInputValidatorFactory } from 'src/app/shared/ui/form/inputs/inputs-password/validators/input-password-validator.factory';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { UserService } from '@src/app/core/services/user.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '@src/app/core/services/session.service';

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

  emailControl = new FormControl('', [
    EmailInputValidatorFactory({
      minlength: 5
    })
  ]);

  passwordControl = new FormControl('', [
    PasswordInputValidatorFactory({
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
}
