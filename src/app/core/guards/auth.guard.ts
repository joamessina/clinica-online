import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

type Role = 'admin' | 'especialista' | 'paciente';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const session = inject(SessionService);

  await session.ensureReady();
  await session.waitForProfile();

  const user = session.user();
  const profile = session.profile();

  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  const allowedRoles = route.data?.['roles'] as Role[] | undefined;
  if (allowedRoles?.length) {
    const role = profile?.role as Role | undefined;

    if (
      role === 'especialista' &&
      allowedRoles.includes('especialista') &&
      !profile?.is_approved
    ) {
      return router.createUrlTree(['/paciente']);
    }

    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree(['/paciente']);
    }
  }

  return true;
};
