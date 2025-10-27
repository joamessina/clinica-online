import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.services';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = await auth.getSession();
  if (!session) {
    router.navigateByUrl('/login');
    return false;
  }
  return true;
};
