import { animate, style, transition, trigger } from '@angular/animations';

export const boxAlertShow = trigger('boxAlert', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-30px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
