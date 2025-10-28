import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);

  // Si no está logueado, refrescamos una vez (puede venir de un reload)
  if (!session.isLoggedIn()) {
    await session.refresh();
    if (!session.isLoggedIn()) {
      router.navigateByUrl('/login');
      return false;
    }
  }
  return true;
};
