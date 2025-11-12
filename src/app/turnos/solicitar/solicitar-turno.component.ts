import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AppointmentsService,
  Slot,
} from '../../core/services/appointments.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';

type Especialidad = { id: string; nombre: string };
type Especialista = {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
};

@Component({
  standalone: true,
  selector: 'app-solicitar-turno',
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss'],
})
export class SolicitarTurnoComponent implements OnInit {
  private svc = inject(AppointmentsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private sb = inject(SupabaseClientService).client;
  private avatars = this.sb.storage.from('avatars');

  readonly defaultSpecialtyIcon = this.avatars.getPublicUrl(
    'system/especialidad.jpg'
  ).data.publicUrl;
  readonly defaultProfileIcon = this.avatars.getPublicUrl(
    'system/userPlaceholder.png'
  ).data.publicUrl;

  selectedSpecialistId: string | null = null;
  selectedSpecialtyId: string | null = null;
  selectedDay: string | null = null;

  specialists: Especialista[] = [];
  specialties: Especialidad[] = [];

  slots: Slot[] = [];
  days: string[] = [];
  hours: string[] = [];
  loading = false;

  async ngOnInit() {
    try {
      this.loading = true;
      this.specialists = await this.svc.listSpecialistsApproved();
    } catch (e) {
      console.warn(e);
    } finally {
      this.loading = false;
    }
  }

  avatarUrl(p: Especialista): string {
    const path = p.avatar_url ?? '';
    if (!path) return this.defaultProfileIcon;
    if (/^https?:\/\//i.test(path)) return path;
    return (
      this.avatars.getPublicUrl(path).data.publicUrl || this.defaultProfileIcon
    );
  }

  specialtyIcon(): string {
    return this.defaultSpecialtyIcon;
  }

  async onPickSpecialist(id: string) {
    this.selectedSpecialistId = id;
    this.selectedSpecialtyId = null;
    this.selectedDay = null;
    this.specialties = [];
    this.slots = [];
    this.days = [];
    this.hours = [];

    try {
      this.loading = true;
      this.specialties = await this.svc.listSpecialtiesBySpecialist(id);
    } catch (e) {
      console.warn(e);
    } finally {
      this.loading = false;
    }
  }

  async onPickSpecialty(id: string) {
    this.selectedSpecialtyId = id;
    this.selectedDay = null;
    this.slots = [];
    this.days = [];
    this.hours = [];
    if (!this.selectedSpecialistId) return;

    try {
      this.loading = true;
      this.slots = await this.svc.listAvailableSlotsLocal(
        this.selectedSpecialistId,
        this.selectedSpecialtyId
      );
      this.days = Array.from(new Set(this.slots.map((s) => s.fecha))).sort();
    } finally {
      this.loading = false;
    }
  }

  onPickDay(d: string) {
    this.selectedDay = d;
    this.hours = this.slots
      .filter((s) => s.fecha === d)
      .map((s) => s.hora.slice(0, 5));
  }

  async reservarTurno(hhmm: string) {
    const u = await this.auth.getCurrentUser();
    if (!u) {
      this.toast.error('Sesión expirada. Volvé a iniciar sesión.');
      return;
    }
    if (
      !this.selectedSpecialistId ||
      !this.selectedSpecialtyId ||
      !this.selectedDay
    )
      return;

    const { error } = await this.svc.createAppointment({
      specialist_id: this.selectedSpecialistId,
      specialty_id: this.selectedSpecialtyId,
      patient_id: u.id,
      fecha: this.selectedDay,
      hora: `${hhmm}:00`,
    });

    if (error) {
      console.warn(error);
      this.toast.error('No se pudo reservar el turno');
    } else {
      this.toast.success('Turno reservado');
      await this.onPickSpecialty(this.selectedSpecialtyId);
      this.onPickDay(this.selectedDay);
    }
  }
}
