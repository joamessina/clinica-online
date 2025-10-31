// src/app/core/supabase/supabase-client.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private _client: SupabaseClient;

  constructor() {
    // ID estable por pestaña (persiste con F5; NO entre tabs)
    let tabId = sessionStorage.getItem('sb_tab_id');
    if (!tabId) {
      tabId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
      sessionStorage.setItem('sb_tab_id', tabId);
    }

    const authOpts: any = {
      persistSession: true,
      autoRefreshToken: false,          // << desactivamos el auto-refresh (clave)
      detectSessionInUrl: false,
      storage: sessionStorage,          // aísla por pestaña
      storageKey: `clinica-auth-${tabId}`,
      multiTab: false                   // por si la lib lo respeta en tu versión
    };

    this._client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      { auth: authOpts as any }
    );
  }

  get client() { return this._client; }
}
