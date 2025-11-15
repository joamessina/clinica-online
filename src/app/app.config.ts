// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SessionService } from './core/services/session.service';
import { provideAnimations } from '@angular/platform-browser/animations';

export function initAuth() {
  const session = inject(SessionService);
  return () => session.hydrate();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      multi: true,
    },
  ],
};
