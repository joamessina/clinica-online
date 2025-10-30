import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import type { User } from '@supabase/supabase-js';
import { Profile } from './profile.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sb = inject(SupabaseClientService).client;

  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  private _initialized!: Promise<void>;
  private _resolveInitialized!: () => void;
  private _initialSeen = false;
  private _ready = signal(false);
  ready = this._ready.asReadonly();

  user = this._user.asReadonly();
  profile = this._profile.asReadonly();
  loading = this._loading.asReadonly();
  isLoggedIn = computed(() => !!this._user());

  constructor() {
    this._initialized = new Promise<void>(
      (res) => (this._resolveInitialized = res)
    );

    this.sb.auth.onAuthStateChange(async (event, session) => {
      this._user.set(session?.user ?? null);

      if (event === 'INITIAL_SESSION' && !this._initialSeen) {
        this._initialSeen = true;
        await this.loadProfile();
        this._resolveInitialized();
        this.markReady('INITIAL_SESSION');

        console.log('[session] ready via INITIAL_SESSION');
      } else if (event === 'SIGNED_OUT') {
        this._profile.set(null);
        this.markReady('SIGNED_OUT');
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        await this.loadProfile();
        this.markReady(event);
      }
    });

    this.sb.auth.getSession().then(async ({ data }) => {
      this._user.set(data.session?.user ?? null);
      if (!this._initialSeen) {
        this._initialSeen = true;
        await this.loadProfile();
        this._resolveInitialized();
        this.markReady('getSession fallback');
        console.log('[session] ready via getSession fallback');
      }
    });
  }

  private markReady(from: string) {
    if (!this._ready()) {
      this._ready.set(true);
      console.log('[session] ready ->', from);
    }
  }

  async waitForProfile(): Promise<void> {
    if (!this.loading()) return;

    await new Promise<void>((resolve) => {
      const watcher = effect(() => {
        if (!this.loading()) {
          watcher.destroy();
          resolve();
        }
      });
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
    }
  }

  async ensureReady(): Promise<void> {
    if (this._ready()) return;
    if (this._initialSeen) {
      this.markReady('ensureReady() shortcut');
      return;
    }

    await Promise.race([
      this._initialized,
      (async () => {
        const { data } = await this.sb.auth.getSession();
        this._user.set(data.session?.user ?? null);
        if (!this._initialSeen) {
          this._initialSeen = true;
          await this.loadProfile();
          this._resolveInitialized?.();
        }
      })(),
    ]);

    this.markReady('ensureReady()');
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
