// src/app/core/services/history.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export interface ClinicalHistoryExtra {
  key: string;
  value: string;
}

export interface ClinicalHistory {
  id: string;
  appointment_id: string;
  patient_id: string;
  specialist_id: string;
  created_at: string;
  altura: number | null;
  peso: number | null;
  temperatura: number | null;
  presion: string | null;

  fecha?: string | null;
  hora?: string | null;
  especialidad_nombre?: string | null;
  especialista_nombre?: string | null;

  extras: ClinicalHistoryExtra[];
  detalle?: string | null;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private sb = inject(SupabaseClientService).client;

  async createForAppointment(
    appointmentId: string,
    payload: {
      patient_id: string;
      specialist_id: string;
      altura: number | null;
      peso: number | null;
      temperatura: number | null;
      presion: string | null;
      extras: ClinicalHistoryExtra[];
    }
  ) {
    const { data, error } = await this.sb
      .from('clinical_history')
      .insert({
        appointment_id: appointmentId,
        patient_id: payload.patient_id,
        specialist_id: payload.specialist_id,
        altura: payload.altura,
        peso: payload.peso,
        temperatura: payload.temperatura,
        presion: payload.presion,
      })
      .select('id')
      .single();

    if (error) throw error;
    const historyId = data.id as string;

    const extrasToInsert = (payload.extras ?? [])
      .filter((e) => e.key && e.value)
      .map((e) => ({
        history_id: historyId,
        key: e.key,
        value: e.value,
      }));

    if (extrasToInsert.length) {
      const { error: exErr } = await this.sb
        .from('clinical_history_extra')
        .insert(extrasToInsert);
      if (exErr) throw exErr;
    }

    return historyId;
  }

  async listForCurrentPatient(): Promise<ClinicalHistory[]> {
    const { data: auth } = await this.sb.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return [];

    // 👇 ahora también traemos el JSONB extras
    const { data: hist, error: hErr } = await this.sb
      .from('clinical_history')
      .select(
        'id, appointment_id, patient_id, specialist_id, created_at, altura, peso, temperatura, presion, extras'
      )
      .eq('patient_id', uid)
      .order('created_at', { ascending: false });

    if (hErr) throw hErr;

    const histories = (hist ?? []) as any[];
    if (!histories.length) return [];

    const historyIds = histories.map((h) => h.id as string);
    const appointmentIds = histories.map((h) => h.appointment_id as string);

    const { data: apps, error: aErr } = await this.sb
      .from('v_appointments_patient')
      .select(
        'id, fecha, hora, especialidad_nombre, especialista_nombre, resena_especialista'
      )
      .in('id', appointmentIds);

    if (aErr) throw aErr;

    const appMap = new Map<string, any>();
    (apps ?? []).forEach((a: any) => appMap.set(a.id, a));

    const { data: extras, error: eErr } = await this.sb
      .from('clinical_history_extra')
      .select('history_id, key, value')
      .in('history_id', historyIds);

    if (eErr) throw eErr;

    const extrasMap = new Map<string, ClinicalHistoryExtra[]>();
    (extras ?? []).forEach((e: any) => {
      const list = extrasMap.get(e.history_id) ?? [];
      list.push({ key: e.key, value: e.value });
      extrasMap.set(e.history_id, list);
    });

    return histories.map((h: any) => {
      const app = appMap.get(h.appointment_id);

      let extrasFinal: ClinicalHistoryExtra[] = extrasMap.get(h.id) ?? [];

      if (!extrasFinal.length && Array.isArray(h.extras)) {
        extrasFinal = (h.extras as any[])
          .map((e) => ({
            key: String(e.key ?? '').trim(),
            value: String(e.value ?? '').trim(),
          }))
          .filter((e) => e.key && e.value);
      }

      return {
        id: h.id,
        appointment_id: h.appointment_id,
        patient_id: h.patient_id,
        specialist_id: h.specialist_id,
        created_at: h.created_at,
        altura: h.altura,
        peso: h.peso,
        temperatura: h.temperatura,
        presion: h.presion,
        fecha: app?.fecha ?? null,
        hora: app?.hora ?? null,
        especialidad_nombre: app?.especialidad_nombre ?? null,
        especialista_nombre: app?.especialista_nombre ?? null,
        extras: extrasFinal,
        detalle: app?.resena_especialista ?? null,
      } as ClinicalHistory;
    });
  }

  async getByAppointment(
    appointmentId: string
  ): Promise<ClinicalHistory | null> {
    const { data, error } = await this.sb
      .from('clinical_history')
      .select(
        `
        id,
        appointment_id,
        patient_id,
        specialist_id,
        altura,
        peso,
        temperatura,
        presion,
        created_at,
        extras:clinical_history_extra ( key, value )
      `
      )
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: data.id,
      appointment_id: data.appointment_id,
      patient_id: data.patient_id,
      specialist_id: data.specialist_id,
      altura: data.altura,
      peso: data.peso,
      temperatura: data.temperatura,
      presion: data.presion,
      created_at: data.created_at,
      extras: (data.extras ?? []).map((e: any) => ({
        key: e.key as string,
        value: e.value as string,
      })),
    };
  }

  async listForPatientAdmin(patientId: string): Promise<ClinicalHistory[]> {
    const { data, error } = await this.sb
      .from('v_clinical_history_patient')
      .select(
        `
      id,
      appointment_id,
      patient_id,
      specialist_id,
      altura,
      peso,
      temperatura,
      presion,
      fecha,
      hora,
      specialist_name,
      specialty_name,
      extras
    `
      )
      .eq('patient_id', patientId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      appointment_id: r.appointment_id,
      patient_id: r.patient_id,
      specialist_id: r.specialist_id,
      created_at: r.created_at,
      altura: r.altura,
      peso: r.peso,
      temperatura: r.temperatura,
      presion: r.presion,
      fecha: r.fecha,
      hora: r.hora,
      especialidad_nombre: r.specialty_name ?? null,
      especialista_nombre: r.specialist_name ?? null,
      extras: (r.extras ?? []) as ClinicalHistoryExtra[],
    }));
  }
}
