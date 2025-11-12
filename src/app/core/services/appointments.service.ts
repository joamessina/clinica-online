import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type TurnoEstado =
  | 'PENDIENTE'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'REALIZADO';

export interface Turno {
  id: string;
  fecha: string;
  hora: string;
  estado: TurnoEstado;

  especialidad_nombre?: string | null;
  especialista_nombre?: string | null;
  paciente_nombre?: string | null;

  specialty_id?: string;
  specialist_id?: string;
  patient_id?: string;

  resena_especialista?: string | null;
}

export interface Slot {
  fecha: string;
  hora: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private sb = inject(SupabaseClientService).client;

  async listSpecialties() {
    const { data, error } = await this.sb
      .from('specialties')
      .select('id, nombre')
      .eq('is_active', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data as { id: string; nombre: string }[];
  }

  async listSpecialistsBySpecialty(specialtyId: string) {
    const { data, error } = await this.sb
      .from('profiles')
      .select(
        'id, nombre, apellido, role, is_approved, profile_specialty!inner(specialty_id)'
      )
      .eq('role', 'especialista')
      .eq('is_approved', true)
      .eq('profile_specialty.specialty_id', specialtyId)
      .order('nombre', { ascending: true });
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id as string,
      nombre: p.nombre as string,
      apellido: p.apellido as string,
    }));
  }

  async listAvailableSlotsLocal(
    specialistId: string,
    specialtyId: string
  ): Promise<Slot[]> {
    const { data: avail, error: aErr } = await this.sb
      .from('specialist_availability')
      .select('weekday, hora_desde, hora_hasta, slot_minutes, active')
      .eq('specialist_id', specialistId)
      .eq('specialty_id', specialtyId)
      .eq('active', true);

    if (aErr) throw aErr;

    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 15);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const { data: taken, error: tErr } = await this.sb
      .from('appointments')
      .select('fecha, hora, estado')
      .eq('specialist_id', specialistId)
      .eq('specialty_id', specialtyId)
      .gte('fecha', startStr)
      .lt('fecha', endStr)
      .in('estado', ['PENDIENTE', 'ACEPTADO', 'REALIZADO']);
    if (tErr) throw tErr;

    const takenSet = new Set(
      (taken ?? []).map((r) => `${r.fecha}T${(r.hora as string).slice(0, 5)}`)
    );

    const slots: Slot[] = [];
    if (!avail || avail.length === 0) return slots;

    const dowFromText = (w: string) => {
      const s = w.toLowerCase();
      if (s.startsWith('dom')) return 0;
      if (s.startsWith('lun')) return 1;
      if (s.startsWith('mar')) return 2;
      if (s.startsWith('mié') || s.startsWith('mie')) return 3;
      if (s.startsWith('jue')) return 4;
      if (s.startsWith('vie')) return 5;
      return 6;
    };

    for (
      let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      d < end;
      d.setDate(d.getDate() + 1)
    ) {
      const dayDow = d.getDay();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;

      for (const a of avail) {
        const aDow = dowFromText(String(a.weekday ?? ''));
        if (aDow !== dayDow) continue;

        const slotMinutes = Number(a.slot_minutes ?? 30);
        const [hD, mD] = String(a.hora_desde)
          .split(':')
          .map((x) => parseInt(x, 10));
        const [hH, mH] = String(a.hora_hasta)
          .split(':')
          .map((x) => parseInt(x, 10));

        const base = new Date(yyyy, d.getMonth(), d.getDate(), hD, mD, 0, 0);
        const stop = new Date(yyyy, d.getMonth(), d.getDate(), hH, mH, 0, 0);

        for (
          let t = new Date(base);
          t < stop;
          t.setMinutes(t.getMinutes() + slotMinutes)
        ) {
          const hh = String(t.getHours()).padStart(2, '0');
          const mi = String(t.getMinutes()).padStart(2, '0');
          const key = `${fechaStr}T${hh}:${mi}`;
          if (!takenSet.has(key)) {
            slots.push({ fecha: fechaStr, hora: `${hh}:${mi}:00` });
          }
        }
      }
    }

    slots.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    return slots;
  }

  async listSpecialistsApproved(): Promise<
    {
      id: string;
      nombre: string;
      apellido: string;
      avatar_url?: string | null;
    }[]
  > {
    const { data, error } = await this.sb
      .from('profiles')
      .select('id,nombre,apellido,avatar_url')
      .eq('role', 'especialista')
      .eq('is_approved', true)
      .order('apellido', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async listSpecialtiesBySpecialist(
    profileId: string
  ): Promise<{ id: string; nombre: string }[]> {
    const { data, error } = await this.sb
      .from('profile_specialty')
      .select('specialties:specialties(id,nombre)')
      .eq('profile_id', profileId);

    if (error) throw error;
    return (data ?? []).map((r: any) => r.specialties);
  }

  async createAppointment(payload: {
    specialist_id: string;
    specialty_id: string;
    patient_id: string;
    fecha: string;
    hora: string;
  }) {
    const { error } = await this.sb.from('appointments').insert({
      ...payload,
      estado: 'PENDIENTE' as TurnoEstado,
    });
    return { error };
  }

  async listPatient() {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { data, error } = await this.sb
      .from('v_appointments_patient')
      .select('*')
      .eq('patient_id', uid)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  async cancelAsPatient(id: string, motivo: string) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb
      .from('appointments')
      .update({
        estado: 'CANCELADO',
        motivo_cancelacion: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('patient_id', uid)
      .in('estado', ['PENDIENTE', 'ACEPTADO']);
    return { error };
  }

  async sendFeedback(
    appointmentId: string,
    calificacion: number,
    comentario?: string
  ) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb.from('patient_feedback').insert({
      appointment_id: appointmentId,
      patient_id: uid,
      calificacion,
      comentario: comentario ?? null,
    });
    return { error };
  }

  async sendSurvey(appointmentId: string, respuestas: any) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb.from('patient_survey').insert({
      appointment_id: appointmentId,
      patient_id: uid,
      respuestas,
    });
    return { error };
  }

  async listSpecialist() {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { data, error } = await this.sb
      .from('v_appointments_specialist')
      .select('*')
      .eq('specialist_id', uid)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  async accept(id: string) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb
      .from('appointments')
      .update({ estado: 'ACEPTADO', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('specialist_id', uid)
      .eq('estado', 'PENDIENTE');
    return { error };
  }

  async reject(id: string, motivo: string) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb
      .from('appointments')
      .update({
        estado: 'RECHAZADO',
        motivo_rechazo: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('specialist_id', uid)
      .eq('estado', 'PENDIENTE');
    return { error };
  }

  async cancelAsSpecialist(id: string, motivo: string) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb
      .from('appointments')
      .update({
        estado: 'CANCELADO',
        motivo_cancelacion: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('specialist_id', uid)
      .in('estado', ['PENDIENTE', 'ACEPTADO']);
    return { error };
  }

  async finish(id: string, resena: string) {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id!;
    const { error } = await this.sb
      .from('appointments')
      .update({
        estado: 'REALIZADO',
        resena_especialista: resena,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('specialist_id', uid)
      .eq('estado', 'ACEPTADO');
    return { error };
  }

  async listAdmin() {
    const { data, error } = await this.sb
      .from('v_appointments_admin')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  async adminCancel(id: string, motivo: string) {
    const { error } = await this.sb
      .from('appointments')
      .update({
        estado: 'CANCELADO',
        motivo_cancelacion: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('estado', ['PENDIENTE', 'ACEPTADO']);
    return { error };
  }
}
