import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { Session, User } from '@supabase/supabase-js';

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

  signInEmail(email: string, password: string) {
    return this.sb.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    await this.sb.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.sb.auth.getSession();
    return data.session ?? null;
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { session },
    } = await this.sb.auth.getSession();
    return session?.user ?? null;
  }
}
