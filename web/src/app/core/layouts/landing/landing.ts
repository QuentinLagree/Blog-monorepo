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
  <section class="session-loading-page" aria-label="Vérification de la session">
  <div class="session-loading-card">
    <div class="session-loading-logo" aria-hidden="true">
      <span class="session-loading-logo__ring"></span>
      <span class="session-loading-logo__mark"></span>
    </div>

    <div class="session-loading-content">
      <p class="session-loading-eyebrow">Connexion sécurisée</p>

      <h1>Préparation de ton espace</h1>

      <p>
        Nous vérifions ta session et récupérons les informations nécessaires
        pour t’orienter vers le bon espace.
      </p>
    </div>

    <div class="session-loading-steps" aria-hidden="true">
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
      
      const [session] = await Promise.all([
        firstValueFrom(this.session.fetchSession().pipe(take(1))),
        firstValueFrom(timer(1000)),
      ]);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

      if (session?.loggedIn) {
        await this.router.navigateByUrl(returnUrl || '/home', { replaceUrl: true });
      } else {
        await this.router.navigate(['/auth/login'], {
          queryParams: returnUrl ? { returnUrl } : undefined,
          replaceUrl: true,
        });
      }
    } finally {
      this.loading = false;
    }
  }
}
