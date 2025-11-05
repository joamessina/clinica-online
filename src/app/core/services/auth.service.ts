import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sb = inject(SupabaseClientService).client;

  signUpEmail(email: string, password: string) {
    return this.sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
  }

  async signInEmailChecked(
    email: string,
    password: string
  ): Promise<
    { ok: true } | { ok: false; code: 'PENDIENTE' | 'CREDENCIALES' | 'OTRO' }
  > {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, code: 'CREDENCIALES' };

    const { data: prof, error: qerr } = await this.sb
      .from('profiles')
      .select('role, is_approved')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!qerr && prof?.role === 'especialista' && prof?.is_approved === false) {
      await this.sb.auth.signOut();
      return { ok: false, code: 'PENDIENTE' };
    }

    return { ok: true };
  }

  signInEmail(email: string, password: string) {
    return this.sb.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    await this.sb.auth.signOut();
  }

  async getSession() {
    const { data } = await this.sb.auth.getSession();
    return data.session ?? null;
  }

  async getCurrentUser() {
    const {
      data: { session },
    } = await this.sb.auth.getSession();
    return session?.user ?? null;
  }
}
