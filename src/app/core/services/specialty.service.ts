import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  private sb = inject(SupabaseClientService).client;

  async listActive() {
    return await this.sb
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('nombre');
  }
  async add(nombre: string) {
    return await this.sb
      .from('specialties')
      .insert({ nombre })
      .select()
      .single();
  }
  async linkToMe(specialtyId: string) {
    const { data: auth } = await this.sb.auth.getUser();
    if (!auth.user) return { error: 'No auth' };
    return await this.sb
      .from('profile_specialty')
      .insert({ profile_id: auth.user.id, specialty_id: specialtyId });
  }
}
