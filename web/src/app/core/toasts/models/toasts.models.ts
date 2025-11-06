import { ButtonType } from "@src/app/shared/ui/form/buttons/base-button";

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  value: string;
  buttonType: ButtonType;
  ariaLabel?: string;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms
  sticky?: boolean;  // pas d'auto-fermeture si true
  actions?: ToastAction[]; // 0..2 actions
  onAction?: (value: string) => void;
  onClose?: () => void;
}

export interface ToastInternal extends Required<Omit<ToastOptions, 'onAction' | 'onClose'>> {
  id: string;
  onAction?: (value: string) => void;
  onClose?: () => void;
  _createdAt: number;
  _remainingMs: number;
  _paused: boolean;
  _closed: boolean
}