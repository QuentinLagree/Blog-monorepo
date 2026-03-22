import { Component, inject } from '@angular/core';
import { TOAST_CONFIG } from '@src/app/core/toasts/models/toasts.config';
import { ToastService } from '@src/app/core/toasts/toaster.service';
import { IconLoaderService } from '../../helpers/icons/services/icons-loader';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss']
})
export class ToastContainerComponent {
  private readonly _iconLoader: IconLoaderService = inject(IconLoaderService);
  service = inject(ToastService);
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  cfg = inject(TOAST_CONFIG, { optional: true }) ?? ({ position: 'top-right' } as any);
  pos: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = this.cfg.position;

  onTransitionEnd(e: TransitionEvent, id: string) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('toast')) return;
    if (e.propertyName !== 'opacity') return;
    this.service.finalizeClose(id);
  }
}
