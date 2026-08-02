import { Component, inject } from "@angular/core";
import { ToastService } from "src/app/shared/helpers/toasts/toaster.service";
import { DangerButtonComponent } from "src/app/shared/ui/form/buttons/button-danger/button-danger";

@Component({
    selector: 'app-profil-zone-danger-section',
    standalone: true,
    imports: [
        DangerButtonComponent
    ],
    templateUrl: './profil-danger-zone.html',
    styleUrls: ['./profil-danger-zone.scss', '../profil-collapse.scss'],
})

export class ProfilDangerZoneSectionComponent {

    private readonly _toast =
        inject(ToastService);
        
    deleteProfileModalOpen = false;
    deleteProfileLoading = false;
    openDeleteProfileModal(): void {
        this.deleteProfileModalOpen = true;
    }

    closeDeleteProfileModal(): void {
        if (this.deleteProfileLoading) {
            return;
        }

        this.deleteProfileModalOpen = false;
    }

    async deleteProfile(): Promise<void> {
        if (this.deleteProfileLoading) {
            return;
        }

        this.deleteProfileLoading = true;

        try {
            this._toast.success(
                'Compte supprimé',
            );

            this.deleteProfileModalOpen = false;
        } finally {
            this.deleteProfileLoading = false;
        }
    }
}