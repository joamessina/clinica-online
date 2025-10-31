import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

type Role = 'admin' | 'especialista' | 'paciente';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const session = inject(SessionService);

  await session.waitReady();
  await session.waitForProfile();

  const user = session.user();
  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  const allowed = route.data?.['roles'] as Role[] | undefined;
  const prof = session.profile();

  if (allowed?.length) {
    const role = prof?.role as Role | undefined;

    if (
      role === 'especialista' &&
      allowed.includes('especialista') &&
      !prof?.is_approved
    ) {
      return router.createUrlTree(['/paciente']);
    }
    if (!role || !allowed.includes(role)) {
      return router.createUrlTree(['/paciente']);
    }
  }

  return true;
};
