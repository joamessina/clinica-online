import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const loginGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(SessionService);

  await session.ensureReady();
  await session.waitForProfile();

  if (!session.user()) return true;

  const p = session.profile();
  if (p?.role === 'admin') return router.createUrlTree(['/admin/usuarios']);
  if (p?.role === 'especialista')
    return router.createUrlTree(['/especialista']);
  return router.createUrlTree(['/paciente']);
};
