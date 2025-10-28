import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export const adminGuard: CanActivateFn = async () => {
  const sb = inject(SupabaseClientService).client;
  const router = inject(Router);
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) { router.navigateByUrl('/login'); return false; }

  const { data: pr } = await sb.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
  if (!pr || pr.role !== 'admin') { router.navigateByUrl('/'); return false; }
  return true;
};
