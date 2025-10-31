// src/app/core/services/session.service.ts
import { Injectable, computed, signal, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from './profile.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sb = inject(SupabaseClientService).client;

  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(false);
  private _ready = signal(false);

  private _initPromise: Promise<void> | null = null;
  private _whenProfileReadyResolvers: Array<() => void> = [];

  // === API pública (igual que tenías) ===
  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  /**
   * Hidrata la sesión persistida y deja listeners activos.
   * Llamalo una sola vez al arrancar la app (ver APP_INITIALIZER abajo).
   */
  async hydrate(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      // 1) Leer sesión persistida inmediatamente (sin timeouts)
      const { data: { session } } = await this.sb.auth.getSession();
      this._user.set(session?.user ?? null);

      // 2) Cargar perfil si hay usuario
      if (session?.user) {
        await this.loadProfile();
      } else {
        this._profile.set(null);
      }

      // 3) Suscripción a futuros cambios de auth
      this.sb.auth.onAuthStateChange(async (_ev, s) => {
        this._user.set(s?.user ?? null);
        await this.loadProfile();
      });

      this._ready.set(true);
    })();
    return this._initPromise;
  }

  /** Espera a que hydrate() termine (útil en guards/servicios). */
  async waitReady(): Promise<void> {
    await this.hydrate();
  }

  /** Igual que tenías, pero sin timeouts ni carreras. */
  async waitForProfile(): Promise<void> {
    if (!this.loading()) return;
    return new Promise<void>((resolve) => {
      this._whenProfileReadyResolvers.push(resolve);
    });
  }

  /** Forzá un reload del perfil (si hay usuario). */
  async refresh() {
    await this.loadProfile();
  }

  async logout() {
    await this.sb.auth.signOut();
    this._user.set(null);
    this._profile.set(null);
    this._ready.set(true);
  }

  // ===== Interno =====
  private async loadProfile() {
    this._loading.set(true);
    try {
      const u = this._user();
      if (!u) {
        this._profile.set(null);
        return;
      }

      // Leer perfil
      const { data: pr, error } = await this.sb
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (error) {
        console.warn('[session] select profile error:', error.message);
      }

      if (pr) {
        this._profile.set(pr as any);
        return;
      }

      // Si no existe, crearlo con defaults seguros
      const { error: upErr } = await this.sb.from('profiles').upsert(
        {
          id: u.id,
          role: 'paciente',
          nombre: '',
          apellido: '',
          edad: 0,
          dni: 'PEND',
          email: u.email,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (upErr) {
        console.warn('[session] upsert profile error:', upErr.message);
      }

      const { data: pr2 } = await this.sb
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      this._profile.set((pr2 as any) ?? null);
    } finally {
      this._loading.set(false);
      // Despertar a quien esperaba el perfil
      const pending = this._whenProfileReadyResolvers.splice(0);
      for (const resolve of pending) resolve();
    }
  }
}
