import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger';
export interface Toast {
  id: string;
  text: string;
  variant: ToastVariant;
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private push(text: string, variant: ToastVariant, timeout = 3500) {
    const t: Toast = { id: crypto.randomUUID(), text, variant, timeout };
    this._toasts.update((arr) => [t, ...arr]);
    if (timeout > 0) {
      setTimeout(() => this.dismiss(t.id), timeout);
    }
  }

  success(msg: string, timeout?: number) {
    this.push(msg, 'success', timeout);
  }
  info(msg: string, timeout?: number) {
    this.push(msg, 'info', timeout);
  }
  warn(msg: string, timeout?: number) {
    this.push(msg, 'warning', timeout);
  }
  error(msg: string, timeout?: number) {
    this.push(msg, 'danger', timeout);
  }

  dismiss(id: string) {
    this._toasts.update((arr) => arr.filter((t) => t.id !== id));
  }
}
