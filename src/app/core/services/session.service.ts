import { Injectable, computed, signal, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import type { User } from '@supabase/supabase-js';
import { Profile } from './profile.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sb = inject(SupabaseClientService).client;
  private _whenProfileReadyResolvers: Array<() => void> = [];

  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  private _initialized!: Promise<void>;
  private _resolveInitialized!: () => void;
  private _initialSeen = false;

  private _ready = signal(false);
  readonly ready = this._ready.asReadonly();

  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  constructor() {
    this._initialized = new Promise<void>(
      (res) => (this._resolveInitialized = res)
    );

    this.sb.auth.onAuthStateChange(async (event, session) => {
      this._user.set(session?.user ?? null);

      if (event === 'INITIAL_SESSION' && !this._initialSeen) {
        this._initialSeen = true;
        await this.loadProfile();
        console.log('[session] ready via INITIAL_SESSION');
        this._resolveInitialized();
        this._ready.set(true);
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'SIGNED_OUT'
      ) {
        await this.loadProfile();
      }
    });

    this.sb.auth
      .getSession()
      .then(async ({ data }) => {
        if (this._initialSeen) return;
        this._user.set(data.session?.user ?? null);
        this._initialSeen = true;
        await this.loadProfile();
        console.log('[session] ready via getSession fallback');
        this._resolveInitialized();
        this._ready.set(true);
      })
      .catch(() => {
        if (!this._initialSeen) {
          this._initialSeen = true;
          this._profile.set(null);
          this._resolveInitialized();
          this._ready.set(true);
        }
      });
  }

  async waitForProfile(): Promise<void> {
    if (!this.loading()) return;
    return new Promise<void>((resolve) => {
      this._whenProfileReadyResolvers.push(resolve);
    });
  }

  private async loadProfile() {
    this._loading.set(true);
    try {
      const u = this._user();
      if (!u) {
        this._profile.set(null);
        return;
      }

      const { data: pr } = await this.sb
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (pr) {
        this._profile.set(pr as any);
      } else {
        await this.sb.from('profiles').upsert(
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
        const { data: pr2 } = await this.sb
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();
        this._profile.set((pr2 as any) ?? null);
      }
    } finally {
      this._loading.set(false);
      const pending = this._whenProfileReadyResolvers.splice(0);
      for (const resolve of pending) resolve();
    }
  }

  async ensureReady(): Promise<void> {
    if (this._initialSeen) {
      this._ready.set(true);
      return;
    }

    const timeout = new Promise<void>((res) =>
      setTimeout(() => {
        if (!this._initialSeen) {
          console.warn(
            '[session] ensureReady(): timeout; continuando sin sesión'
          );
          this._initialSeen = true;
          this._profile.set(null);
          this._resolveInitialized?.();
        }
        res();
      }, 1500)
    );

    await Promise.race([this._initialized, timeout]);
    this._ready.set(true);
  }

  async refresh() {
    await this.loadProfile();
  }

  async logout() {
    await this.sb.auth.signOut();
    this._user.set(null);
    this._profile.set(null);
    this._ready.set(true);
  }
}
