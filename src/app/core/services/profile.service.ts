import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type Role = 'admin' | 'especialista' | 'paciente';
export interface Profile {
  id: string;
  role: Role;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obra_social?: string | null;
  email: string;
  is_approved: boolean;
  avatar_url?: string | null;
  extra_img_url?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private sb = inject(SupabaseClientService).client;

  async upsertProfile(p: Partial<Profile>) {
    return await this.sb.from('profiles').upsert(p).select().single();
  }

  async getMyProfile(): Promise<Profile | null> {
    const { data: auth } = await this.sb.auth.getUser();
    if (!auth.user) return null;
    const { data } = await this.sb
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();
    return (data as Profile) ?? null;
  }

  async adminListUsers() {
    return await this.sb
      .from('v_users')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async adminToggleApproval(profileId: string, isApproved: boolean) {
    return await this.sb
      .from('profiles')
      .update({ is_approved: isApproved })
      .eq('id', profileId);
  }
}
