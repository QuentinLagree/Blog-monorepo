import { InjectionToken } from '@angular/core';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastConfig {
  maxVisible: number;
  defaultDuration: number; // ms
  position: ToastPosition;
  deduplicate: boolean;
}

export const TOAST_CONFIG = new InjectionToken<ToastConfig>('TOAST_CONFIG');

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  maxVisible: 2,
  defaultDuration: 3000,
  position: 'top-right',
  deduplicate: false,
};
