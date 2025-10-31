// src/app/app.config.ts (o el archivo donde configures la app)
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SessionService } from './core/services/session.service';

export function initAuth() {
  const session = inject(SessionService);
  return () => session.hydrate(); // ← Bloquea el boot hasta hidratar la sesión
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: APP_INITIALIZER, useFactory: initAuth, multi: true },
  ],
};
