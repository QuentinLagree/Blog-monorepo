// core/landing/landing.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-landing',
  template: `
  <div class="landing-wrapper">
  <div class="logo">Mon App</div>

  @if (loading) {
    <div class="spinner">
    <!-- ton loader CSS ou un skeleton -->
    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    <p>Chargement de votre session…</p>
  </div>
  }
</div>`,
})
export class LandingComponent implements OnInit {
  private session = inject(SessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = true;

  async ngOnInit() {
    try {
      // Affichage minimum du loader (400ms) + résolution session (take(1))
      const [s] = await Promise.all([
        firstValueFrom(this.session.fetchSession().pipe(take(1))),
        firstValueFrom(timer(400)), // garantit que le loader se voit
      ]);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

      if (s?.loggedIn) {
        await this.router.navigateByUrl(returnUrl || '/home', { replaceUrl: true });
      } else {
        await this.router.navigate(['/auth/login'], {
          queryParams: returnUrl ? { returnUrl } : undefined,
          replaceUrl: true,
        });
      }
    } finally {
      // au cas où la navigation ne se fait pas (erreur), on masque le loader
      this.loading = false;
    }
  }
}
