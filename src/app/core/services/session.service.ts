// src/app/core/services/session.service.ts
import { Injectable, computed, signal, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { Profile } from './profile.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sb = inject(SupabaseClientService).client;

  private _user = signal<Awaited<ReturnType<typeof this.sb.auth.getUser>>['data']['user'] | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  user = this._user.asReadonly();
  profile = this._profile.asReadonly();
  loading = this._loading.asReadonly();
  isLoggedIn = computed(() => !!this._user());

  constructor() {
    this.bootstrap();
    this.sb.auth.onAuthStateChange(async (ev) => {
      console.log('[auth change]', ev);
      await this.refresh();
    });
  }

  async bootstrap() {
    await this.refresh();
  }

private _refreshing = false;

async refresh() {
  if (this._refreshing) return;
  this._refreshing = true;
  this._loading.set(true);
  try {
    // 1) Sesión robusta
    const { data: s } = await this.sb.auth.getSession();
    const user = s?.session?.user ?? null;
    this._user.set(user);

    if (!user) { this._profile.set(null); return; }

    // 2) Traer perfil
    const { data: pr, error: perr } = await this.sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (perr) console.error('[profiles.select] error', perr);

    if (!pr) {
      // 3) Crear si falta, sin colisiones
      const { error: ierr } = await this.sb
        .from('profiles')
        .upsert(
          {
            id: user.id,
            role: 'paciente',
            nombre: '',
            apellido: '',
            edad: 0,
            dni: 'PEND',
            email: user.email,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      if (ierr) { console.error('[profiles.upsert] error', ierr); this._profile.set(null); return; }

      const { data: pr2 } = await this.sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      this._profile.set((pr2 as any) ?? null);
    } else {
      this._profile.set(pr as any);
    }
  } catch (e) {
    console.error('[session.refresh] fatal', e);
    this._profile.set(null);
  } finally {
    this._refreshing = false;
    this._loading.set(false);
  }
}



  async logout() {
    await this.sb.auth.signOut();
    await this.refresh();
  }
}
