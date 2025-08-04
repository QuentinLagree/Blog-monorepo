import { Component, inject } from "@angular/core";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { SubmitButtonComponent } from "src/app/shared/ui/form/buttons/button-submit/button-submit";
import { EmailInputComponent } from "src/app/shared/ui/form/inputs/input-email/input-email";
import { EmailInputValidatorFactory } from "src/app/shared/ui/form/inputs/input-email/validators/input-email-validator.factory";
import { InputComponent } from "src/app/shared/ui/form/inputs/input/input";
import { TextInputValidatorFactory } from "src/app/shared/ui/form/inputs/input/validators/input-text-validator.factory";
import { InputPassswordComponent } from "src/app/shared/ui/form/inputs/inputs-password/inputs-password";
import { PasswordInputValidatorFactory } from "src/app/shared/ui/form/inputs/inputs-password/validators/input-password-validator.factory";

@Component({
    selector: "app-login-page",
    imports: [InputComponent, ReactiveFormsModule, EmailInputComponent, InputPassswordComponent, SubmitButtonComponent],
    standalone: true,
    templateUrl: './login.html'
})

export class LoginPageComponent {
    
    private _formBuilder: FormBuilder = inject(FormBuilder)



    usernameControl = new FormControl('', [TextInputValidatorFactory()]);

    emailControl = new FormControl('', [EmailInputValidatorFactory({
        minlength: 5
    })])

    passwordControl = new FormControl('', [PasswordInputValidatorFactory()])

    passwordConfirmControl = new FormControl('', [PasswordInputValidatorFactory({
        minlength: 0,
        options: {
            useStrengthCheck: false,
            hasSameValueOf: this.passwordControl
        }
    })])



    form = this._formBuilder.group({
        username: this.usernameControl,
        email: this.emailControl,
        password: this.passwordControl,
        password_confirm: this.passwordConfirmControl
    });

    submit = () => {
        console.log("Le bouton fonctionne correctement.")
    }

}