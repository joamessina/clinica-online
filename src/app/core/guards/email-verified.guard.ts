import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.services';

export const emailVerifiedGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.getCurrentUser();
  if (!user || !user.email_confirmed_at) {
    router.navigateByUrl('/login');
    return false;
  }
  return true;
};
