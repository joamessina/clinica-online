// src/app/core/services/loader.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _active = signal(false);
  active = this._active.asReadonly();

  async run<T>(fn: () => Promise<T>): Promise<T> {
    this._active.set(true);
    try {
      return await fn();
    } finally {
      this._active.set(false);   // <- pase lo que pase, se apaga
    }
  }
}
