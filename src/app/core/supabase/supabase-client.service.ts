import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private _client: SupabaseClient;

  constructor() {
    const tabKey =
      sessionStorage.getItem('sb_tabkey') ??
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    sessionStorage.setItem('sb_tabkey', tabKey);

    this._client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: `sb-${tabKey}`,
        },
      }
    );
  }

  get client() {
    return this._client;
  }
}
