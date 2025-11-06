import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialtyService } from '../../core/services/specialty.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  standalone: true,
  selector: 'app-solicitar-turno',
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss'],
})
export class SolicitarTurnoComponent implements OnInit {
  private specSvc = inject(SpecialtyService);
  private apptSvc = inject(AppointmentsService);
  private session = inject(SessionService);

  specialties = signal<{id:string; nombre:string}[]>([]);
  specialists = signal<{id:string; nombre:string; apellido:string}[]>([]);
  slots = signal<{fecha:string; hora:string}[]>([]);

  selSpecialty: string | null = null;
  selSpecialist: string | null = null;

  grouped = computed(() => {
    const g: Record<string, {fecha:string; horas:string[]}> = {};
    for (const s of this.slots()) {
      g[s.fecha] ??= { fecha: s.fecha, horas: [] };
      g[s.fecha].horas.push(s.hora);
    }
    return Object.values(g);
  });

  async ngOnInit() {
    const { data } = await this.specSvc.listActive();
    this.specialties.set((data ?? []).map((d:any)=>({id:d.id, nombre:d.nombre})));
  }

  async pickSpecialty(id: string) {
    this.selSpecialty = id; this.selSpecialist = null; this.slots.set([]);
    this.specialists.set(await this.apptSvc.listSpecialistsBySpecialty(id));
  }

  async pickSpecialist(id: string) {
    this.selSpecialist = id;
    if (!this.selSpecialty) return;
    this.slots.set(await this.apptSvc.availableSlots(id, this.selSpecialty));
  }

  async solicitar(fecha: string, hora: string) {
    if (!this.selSpecialty || !this.selSpecialist) return;
    const { error } = await this.apptSvc.requestAppointment(this.selSpecialty, this.selSpecialist, fecha, hora);
    if (error) { alert(error.message); return; }
    alert('Turno solicitado.');
  }
}
