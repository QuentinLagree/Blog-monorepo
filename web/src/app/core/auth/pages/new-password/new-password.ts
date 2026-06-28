import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from 'src/app/shared/ui/form/inputs/input-email/input-email';
import { EmailInputValidatorFactory } from 'src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { AuthService } from 'src/app/core/services/auth.service';
import { finalize } from 'rxjs';
import { InputPassswordComponent } from 'src/app/shared/ui/form/inputs/inputs-password/inputs-password';
import { PasswordInputValidatorFactory } from 'src/app/shared/ui/form/inputs/inputs-password/validators/input-password-validator.factory';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, InputPassswordComponent, BaseButtonComponent],
  standalone: true,
  templateUrl: './new-password.html',
  styleUrls: ['./new-password.scss']
})
export class NewPasswordComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _auth: AuthService = inject(AuthService)

      private queryParamsMap = toSignal(this._activatedRoute.queryParamMap, {
        initialValue: this._activatedRoute.snapshot.queryParamMap    })
    token = computed(() =>this.queryParamsMap()?.get('token') ?? 0);
    email = computed(() =>this.queryParamsMap()?.get('email') ?? "");

  loading = false;

  passwordControl = new FormControl('Salut1234!', [PasswordInputValidatorFactory()]);
  
    confirmPasswordControl = new FormControl('Salut1234!', [PasswordInputValidatorFactory({
      required: true,
      options: {
        hasSameValueOf: this.passwordControl
      }
    })]);

  form = this._formBuilder.group({
    password: this.passwordControl,
    confirm_password: this.confirmPasswordControl
  });

  submit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading) return;

    this.loading = true;

    const { password, confirm_password } = this.form.getRawValue();

    if (password === null || confirm_password === null) return;

    
    console.log(this.token().toString())
    
    setTimeout(() => {
      this._auth
        .changePassword({ email: this.email(), password, confirm_password, token: this.token().toString() })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: () => {
            this._router.navigate([''])
          }
        });
    }, 2000);
    
      
  };
}
