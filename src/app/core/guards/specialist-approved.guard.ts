import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const specialistApprovedGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.profile()) {
    await session.refresh();
  }
  const me = session.profile();
  if (!me || me.role !== 'especialista' || !me.is_approved) {
    return router.createUrlTree(['/']);
  }
  return true;
};
