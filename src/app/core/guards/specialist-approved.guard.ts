import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';

export const specialistApprovedGuard: CanActivateFn = async () => {
  const profile = await inject(ProfileService).getMyProfile();
  const router = inject(Router);
  if (!profile || profile.role !== 'especialista' || !profile.is_approved) {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
