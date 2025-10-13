import { Injectable, inject, signal } from "@angular/core";
import { TOAST_CONFIG, DEFAULT_TOAST_CONFIG } from "./models/toasts.config";
import { ToastInternal, ToastOptions, ToastVariant } from "./models/toasts.models";

@Injectable({ providedIn: 'root' })
export class ToastService {
  private config = inject(TOAST_CONFIG, { optional: true }) ?? DEFAULT_TOAST_CONFIG;

  private visible: ToastInternal[] = [];
  private queue: ToastInternal[] = [];
  private timers = new Map<string, { handle: ReturnType<typeof setTimeout>; start: number }>();

  private _toasts = signal<ToastInternal[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, opts: Omit<ToastOptions, 'message' | 'variant'> = {}) { return this.show({ ...opts, message, variant: 'success', title: "Succès" }); }
  error(message: string, opts: Omit<ToastOptions, 'message' | 'variant'> = {}) { return this.show({ ...opts, message, variant: 'error', title: "Erreur" }); }
  info(message: string, opts: Omit<ToastOptions, 'message' | 'variant'> = {}) { return this.show({ ...opts, message, variant: 'info', title: "Infos" }); }
  warning(message: string, opts: Omit<ToastOptions, 'message' | 'variant'> = {}) { return this.show({ ...opts, message, variant: 'warning', title: "Attention !" }); }

  show(options: ToastOptions) {
    const toast = this.createInternal(options);

    if (this.config.deduplicate && this.visible.some(t => t.message === toast.message && t.variant === toast.variant)) {
      return toast.id;
    }

    if (this.visible.length < this.config.maxVisible) {
      this.visible.unshift(toast); // dernier en haut
      this._toasts.set([...this.visible]);
      this.startTimer(toast);
    } else {
      this.queue.push(toast);
    }
    return toast.id;
  }

  
close(id: string, reason: 'timeout' | 'action' | 'manual' = 'manual') {
  const t = this.visible.find(x => x.id === id);
  if (!t || t._closed) return;
  t._closed = true;
  this.clearTimer(id);             
  this._toasts.set([...this.visible]);
}

finalizeClose(id: string) {
  const idx = this.visible.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [removed] = this.visible.splice(idx, 1);
  removed.onClose?.();
  this._toasts.set([...this.visible]);

  const next = this.queue.shift();
  if (next) {                      
    this.visible.unshift(next);
    this._toasts.set([...this.visible]);
    this.startTimer(next);
  }
}

  action(id: string, value: string) {
    const toast = this.visible.find(t => t.id === id);
    toast?.onAction?.(value);
    this.close(id, 'action');
  }

  pause(id: string) {
    const toast = this.visible.find(t => t.id === id);
    if (!toast || toast.sticky || toast._paused) return;
    toast._paused = true;
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.handle);
      toast._remainingMs -= Date.now() - timer.start;
      this.timers.delete(id);
    }
    this._toasts.set([...this.visible]);
  }

  resume(id: string) {
    const toast = this.visible.find(t => t.id === id);
    if (!toast || toast.sticky || !toast._paused) return;
    toast._paused = false;
    this.startTimer(toast);
    this._toasts.set([...this.visible]);
  }

  private startTimer(t: ToastInternal) {
  if (t.sticky) return;
  const remaining = Math.max(0, t._remainingMs);
  const handle = setTimeout(() => this.close(t.id, 'timeout'), remaining);
  this.timers.set(t.id, { handle, start: Date.now() });
}

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  private createInternal(opts: ToastOptions): ToastInternal {
    const id = opts.id ?? this.uuid();
    const variant: ToastVariant = opts.variant ?? 'info';
    const duration = opts.duration ?? this.durationFor(variant);
    const sticky = !!opts.sticky;

    return {
      id,
      title: opts.title ?? '',
      message: opts.message,
      variant,
      duration,
      sticky,
      actions: opts.actions ?? [],
      onAction: opts.onAction,
      onClose: opts.onClose,
      _createdAt: Date.now(),
      _remainingMs: duration,
      _paused: false,
      _closed: false
    };
  }

  private durationFor(variant: ToastVariant) {
    switch (variant) {
      case 'error': return Math.max(5000, this.config.defaultDuration);
      case 'warning': return this.config.defaultDuration + 1000;
      default: return this.config.defaultDuration;
    }
  }

  get getQueue (): ToastInternal[] {
    return this.queue
  }

  private uuid() { return 't_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
}
