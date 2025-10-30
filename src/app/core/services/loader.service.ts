import { Injectable, signal } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _active = signal(false);
  active = this._active.asReadonly();

  private pending = 0;
  private watchdog?: ReturnType<typeof setTimeout>;

  show() {
    this.pending++;
    this._active.set(true);
    this.armWatchdog();
  }

  hide() {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) {
      this._active.set(false);
      this.disarmWatchdog();
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.show();
    try {
      return await fn();
    } finally {
      this.hide();
    }
  }

  bindToRouter(router: Router) {
    router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) this.show();
      if (
        ev instanceof NavigationEnd ||
        ev instanceof NavigationCancel ||
        ev instanceof NavigationError
      ) {
        this.hide();
      }
    });
  }

  private armWatchdog() {
    this.disarmWatchdog();
    this.watchdog = setTimeout(() => {
      console.warn(
        '[loader] watchdog: forzando apagado (pendientes=',
        this.pending,
        ')'
      );
      this.pending = 0;
      this._active.set(false);
    }, 7000);
  }
  private disarmWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = undefined;
  }
}
