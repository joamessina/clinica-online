import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private _client: SupabaseClient;

  constructor() {
    // clave por pestaña (persistida en sessionStorage)
    const tabKey =
      sessionStorage.getItem('sb_tabkey') ??
      (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    sessionStorage.setItem('sb_tabkey', tabKey);

    this._client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // esto “separa” las sesiones por pestaña y te evita los locks
        storageKey: `sb-${tabKey}`,
        // detectSessionInUrl:true // (dejalo por defecto si usás magic links)
      },
    });
  }

  get client() { return this._client; }
}
