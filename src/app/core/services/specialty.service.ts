import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type Specialty = { id: string; nombre: string; is_active: boolean };

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  private sb = inject(SupabaseClientService).client;

  // Lista activas (por si lo usas en register)
  async listActive() {
    return await this.sb
      .from('specialties')
      .select('id,nombre')
      .eq('is_active', true)
      .order('nombre', { ascending: true });
  }

  // Crea una especialidad simple
  async add(nombre: string) {
    const { data, error } = await this.sb
      .from('specialties')
      .insert({ nombre: nombre.trim(), is_active: true })
      .select('id,nombre')
      .single();
    return { data, error };
  }

  /**
   * ensure(nombre): devuelve el id de la especialidad.
   * - Si existe (mismo nombre), la devuelve.
   * - Si no existe, la crea en is_active=true y devuelve el id nuevo.
   */
  async ensure(nombre: string): Promise<string> {
    const n = nombre.trim();
    if (!n) throw new Error('Nombre de especialidad vacío');

    // Intentar encontrarla (igualdad exacta; si querés case-insensitive, podés usar ilike con patrón)
    const { data: found, error: findErr } = await this.sb
      .from('specialties')
      .select('id')
      .eq('nombre', n)
      .maybeSingle();

    if (!findErr && found?.id) return found.id as string;

    // No existe: crearla
    const { data, error } = await this.sb
      .from('specialties')
      .insert({ nombre: n, is_active: true })
      .select('id')
      .single();

    if (error) throw error;
    return data!.id as string;
  }
}
