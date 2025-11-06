import { Injectable } from '@angular/core';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

@Injectable({ providedIn: 'root' })
export class RecaptchaLoaderService {
  private loading?: Promise<void>;
  private readonly SCRIPT_ID = 'google-recaptcha-v2';

  load(): Promise<void> {
    if (this.loading) return this.loading;

    // Si ya está cargado, listo
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      return Promise.resolve();
    }

    this.loading = new Promise<void>((resolve, reject) => {
      if (document.getElementById(this.SCRIPT_ID)) {
        this.waitForGrecaptcha(resolve);
        return;
      }

      const s = document.createElement('script');
      s.id = this.SCRIPT_ID;
      s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
      s.onload = () => this.waitForGrecaptcha(resolve);
      document.head.appendChild(s);
    });

    return this.loading;
  }

  private waitForGrecaptcha(done: () => void) {
    const check = () => {
      if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
        done();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  }
}
