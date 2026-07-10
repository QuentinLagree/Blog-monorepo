// core/landing/landing.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { SessionService } from 'src/app/shared/services/session.service';

@Component({
  selector: 'app-landing',
  template: `
  <div class="landing-wrapper">
  <div class="logo">Mon App</div>

  @if (loading) {
    <div class="spinner">
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
      
      const [session] = await Promise.all([
        firstValueFrom(this.session.fetchSession().pipe(take(1))),
        firstValueFrom(timer(5000)),
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
