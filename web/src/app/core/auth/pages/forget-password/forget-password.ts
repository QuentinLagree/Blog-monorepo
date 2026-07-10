import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from 'src/app/shared/ui/form/inputs/input-email/input-email';
import { EmailInputValidatorFactory } from 'src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory';
import { InputPassswordComponent } from 'src/app/shared/ui/form/inputs/inputs-password/inputs-password';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { UserService } from 'src/app/shared/services/user.service';
import { ContextMenuTriggerDirective } from "src/app/shared/ui/context-menu/context-menu.directive";
import { AuthService } from 'src/app/core/auth/data-access/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, EmailInputComponent, BaseButtonComponent],
  standalone: true,
  templateUrl: './forget-password.html',
  styleUrls: ['./forget-password.scss']
})
export class ForgetPasswordComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _auth: AuthService = inject(AuthService);

  loading = false;

  emailControl = new FormControl('', [
    EmailInputValidatorFactory({
      minlength: 5
    })
  ]);

  form = this._formBuilder.group({
    email: this.emailControl,
  });

  submit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading) return;

    this.loading = true;

    const { email } = this.form.getRawValue();
    
      this._auth
      .getEmailForgetPassword({
        email: email ?? ""
      })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      ).subscribe()
  };
}
