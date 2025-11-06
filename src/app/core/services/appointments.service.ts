import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type Estado = 'PENDIENTE'|'ACEPTADO'|'RECHAZADO'|'CANCELADO'|'REALIZADO';
export interface Turno {
  id: string; fecha: string; hora: string; estado: Estado;
  specialty_id: string; specialist_id: string; patient_id: string;
  especialidad_nombre?: string; especialista_nombre?: string; paciente_nombre?: string;
  resena_especialista?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private sb = inject(SupabaseClientService).client;

  // LISTAS
  async listPatient(): Promise<Turno[]> {
    const { data, error } = await this.sb.from('v_appointments_patient').select('*')
      .order('fecha', { ascending: true }).order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  async listSpecialist(): Promise<Turno[]> {
    const { data, error } = await this.sb.from('v_appointments_specialist').select('*')
      .order('fecha', { ascending: true }).order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  async listAdmin(): Promise<Turno[]> {
    const { data, error } = await this.sb.from('v_appointments_admin').select('*')
      .order('fecha', { ascending: true }).order('hora', { ascending: true });
    if (error) throw error;
    return data as Turno[];
  }

  // DISPONIBILIDAD / SLOTS
  async listSpecialistsBySpecialty(specialtyId: string) {
    const { data, error } = await this.sb.rpc('list_specialists', { _specialty: specialtyId });
    if (error) throw error;
    return (data ?? []) as { id: string; nombre: string; apellido: string }[];
  }

  async availableSlots(specialistId: string, specialtyId: string, from?: string, to?: string) {
    const { data, error } = await this.sb.rpc('available_slots', {
      _specialist: specialistId, _specialty: specialtyId,
      _from: from ?? null, _to: to ?? null
    });
    if (error) throw error;
    return (data ?? []) as { fecha: string; hora: string }[];
  }

  // ACCIONES
  requestAppointment(specialtyId: string, specialistId: string, fecha: string, hora: string, patientId?: string) {
    return this.sb.rpc('fn_request_appointment', {
      _specialty: specialtyId, _specialist: specialistId, _fecha: fecha, _hora: hora, _patient: patientId ?? null
    });
  }

  cancelAsPatient(id: string, motivo: string) {
    return this.sb.rpc('fn_patient_cancel', { _id: id, _motivo: motivo });
  }
  accept(id: string)  { return this.sb.rpc('fn_specialist_accept',  { _id: id }); }
  reject(id: string, motivo: string) { return this.sb.rpc('fn_specialist_reject', { _id: id, _motivo: motivo }); }
  cancelAsSpecialist(id: string, motivo: string) { return this.sb.rpc('fn_specialist_cancel', { _id: id, _motivo: motivo }); }
  finish(id: string, resena: string) { return this.sb.rpc('fn_specialist_finish', { _id: id, _resena: resena }); }
  adminCancel(id: string, motivo: string) { return this.sb.rpc('fn_admin_cancel', { _id: id, _motivo: motivo }); }

  sendFeedback(appId: string, cal: number, comentario?: string) {
    return this.sb.rpc('fn_send_feedback', { _appointment: appId, _cal: cal, _coment: comentario ?? null });
  }
  sendSurvey(appId: string, respuestas: any) {
    return this.sb.rpc('fn_send_survey', { _appointment: appId, _respuestas: respuestas });
  }
}
