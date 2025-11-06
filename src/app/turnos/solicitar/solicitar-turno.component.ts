// src/app/turnos/solicitar/solicitar-turno.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AppointmentsService,
  Slot,
} from '../../core/services/appointments.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type Especialidad = { id: string; nombre: string };
type Especialista = { id: string; nombre: string; apellido: string };

@Component({
  standalone: true,
  selector: 'app-solicitar-turno',
  imports: [CommonModule],
  templateUrl: './solicitar-turno.component.html',
})
export class SolicitarTurnoComponent implements OnInit {
  private svc = inject(AppointmentsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  // filtros activos
  activeSpecialtyId: string | null = null;
  selectedSpecialistId: string | null = null;

  // catálogos
  specialties: Especialidad[] = [];
  specialists: Especialista[] = [];

  // slots disponibles
  slots: Slot[] = [];
  loadingSlots = false;

  // agrupado por fecha para pintar tarjetas
  grouped: { fecha: string; horas: string[] }[] = [];

  async ngOnInit() {
    // cargo especialidades al entrar
    try {
      this.specialties = await this.svc.listSpecialties();
    } catch (e) {
      console.warn(e);
    }
  }

  async onPickSpecialty(id: string) {
    this.activeSpecialtyId = id;
    this.selectedSpecialistId = null;
    this.slots = [];
    this.grouped = [];
    // cargo especialistas de esa especialidad
    try {
      this.specialists = await this.svc.listSpecialistsBySpecialty(id);
    } catch (e) {
      console.warn(e);
    }
  }

  async onPickSpecialist(id: string) {
    this.selectedSpecialistId = id;
    await this.loadSlots();
  }

  private async loadSlots() {
    if (!this.activeSpecialtyId || !this.selectedSpecialistId) return;
    this.loadingSlots = true;
    try {
      this.slots = await this.svc.listAvailableSlotsLocal(
        this.selectedSpecialistId,
        this.activeSpecialtyId
      );

      // agrupo slots por fecha -> {fecha, [horas]}
      const map = new Map<string, string[]>();
      for (const s of this.slots) {
        if (!map.has(s.fecha)) map.set(s.fecha, []);
        map.get(s.fecha)!.push(s.hora);
      }
      // ordeno horas dentro del día y días asc
      this.grouped = Array.from(map.entries())
        .map(([fecha, horas]) => ({
          fecha,
          horas: horas.sort(), // ya vienen "HH:mm:ss"
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    } finally {
      this.loadingSlots = false;
    }
  }

  async reservarTurno(s: Slot) {
    const u = await this.auth.getCurrentUser();
    if (!u) {
      this.toast.error('Sesión expirada. Volvé a iniciar sesión.');
      return;
    }
    const { error } = await this.svc.createAppointment({
      specialist_id: this.selectedSpecialistId!,
      specialty_id: this.activeSpecialtyId!,
      patient_id: u.id, // id del user logueado
      fecha: s.fecha,
      hora: s.hora,
    });

    if (error) {
      console.warn(error);
      this.toast.error('No se pudo reservar el turno');
    } else {
      this.toast.success('Turno reservado');
      await this.loadSlots(); // refresco para ocultar el slot tomado
    }
  }
}
