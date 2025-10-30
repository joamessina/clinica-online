// src/app/core/services/loader.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _active = signal(false);
  active = this._active.asReadonly();

  private pending = 0;

  private watchdogTimer: any = null;

  show(reason: string = 'unknown') {
    this.pending++;
    this._active.set(true);
    this.armarWatchdog();
  }

  hide(reason: string = 'unknown') {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) {
      this._active.set(false);
      this.desarmarWatchdog();
    }
  }

  async run<T>(fn: () => Promise<T>, reason: string = 'run'): Promise<T> {
    this.show(reason);
    try {
      return await fn();
    } finally {
      this.hide(reason);
    }
  }

  private armarWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setTimeout(() => {
      if (this.pending > 0) {
        console.warn(
          '[loader] watchdog: forzando apagado (pendientes:',
          this.pending,
          ')'
        );
        this.pending = 0;
        this._active.set(false);
      }
      this.desarmarWatchdog();
    }, 6000);
  }

  private desarmarWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
}
