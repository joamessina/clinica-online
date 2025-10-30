import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(SessionService);

  await session.ensureReady();
  const user = session.user();
  const profile = session.profile();

  if (!user) {
    return router.createUrlTree(['/login']);
  }
  if (profile?.role !== 'admin') {
    return router.createUrlTree(['/']);
  }
  return true;
};
