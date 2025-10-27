import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';

export const adminGuard: CanActivateFn = async () => {
  const profileSrv = inject(ProfileService);
  const router = inject(Router);
  const me = await profileSrv.getMyProfile();
  if (!me || me.role !== 'admin') {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
