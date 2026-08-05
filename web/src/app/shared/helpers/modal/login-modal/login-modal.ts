import { Component, effect, inject, input, InputSignal, OnInit, signal, WritableSignal } from "@angular/core";
import { ConfirmModalComponent } from "../confirm-modal/confirm-modal";
import { Router } from "@angular/router";

@Component({
    selector: 'app-modal-login',
    standalone: true,
    template: `
        <app-confirm-modal
        [open]="open()"
        [showNote]="false"
        title="Connection requise"
        message="Vous devez être connecté pour effectuer cette action. Connectez-vous pour continuer. Si vous n'avez pas de compte, vous pouvez en créer un. Clique en dehors du pop-up pour la fermer."
        confirmLabel="Se connecter"
        cancelLabel="S'inscrire"
        (confirmed)="goPage('auth/login')"
        (cancelled)="goPage(url())"
        ></app-confirm-modal>
    `,
    imports: [ConfirmModalComponent],
})
export class LoginModalComponent {

    private _router: Router = inject(Router);
    showModal: InputSignal<boolean> = input.required()
    open: WritableSignal<boolean> = signal(false)
    url = signal(decodeURIComponent(this._router.url))
    constructor () {
        
        effect(() => {
            this.open.set(this.showModal())
        })
    }

    goPage(url: string) {
        this.open.set(false)
        this._router.navigate([url])
    }

    

}