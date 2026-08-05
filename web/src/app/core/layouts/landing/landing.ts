// core/landing/landing.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { SessionService } from 'src/app/shared/services/session.service';

@Component({
  selector: 'app-landing',
  styleUrls: ['./landing.scss'],
  template: `
  <section
  class="session-loading-page page"
  aria-label="Vérification de la session">

  <div class="session-loading-card card card--md">
    <div
      class="session-loading-logo"
      aria-hidden="true">

      <span class="session-loading-logo__ring"></span>

      <span class="session-loading-logo__mark">
        ✓
      </span>
    </div>

    <div class="session-loading-content">
      <p class="text-eyebrow">
        Connexion sécurisée
      </p>

      <h1 class="text-title-md">
        Préparation de ton espace
      </h1>

      <p class="text-body">
        Nous vérifions ta session et récupérons les informations nécessaires
        pour t’orienter vers le bon espace.
      </p>
    </div>

    <div
      class="session-loading-steps"
      aria-hidden="true">

      <span class="session-loading-step session-loading-step--active"></span>
      <span class="session-loading-step"></span>
      <span class="session-loading-step"></span>
    </div>
  </div>
</section>`,
})
export class LandingComponent implements OnInit {
  private session = inject(SessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = true;

  async ngOnInit() {
    try {

      await Promise.all([
        firstValueFrom(this.session.fetchSession().pipe(take(1))),
      ]);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigate(['/home'], {
        queryParams: returnUrl ? { returnUrl } : undefined,
        replaceUrl: true,
      });
    } finally {
      this.loading = false;
    }
  }
}
