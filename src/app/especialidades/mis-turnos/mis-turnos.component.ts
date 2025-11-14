// src/app/especialista/mis-turnos/mis-turnos.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AppointmentsService,
  Turno,
} from '../../core/services/appointments.service';
import { Location } from '@angular/common';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import {
  HistoryService,
  ClinicalHistoryExtra,
} from '../../core/services/history.service';

@Component({
  standalone: true,
  selector: 'app-mis-turnos-especialista',
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss'],
})
export class MisTurnosEspecialistaComponent implements OnInit {
  private location = inject(Location);
  private svc = inject(AppointmentsService);
  private history = inject(HistoryService);

  goBack() {
    this.location.back();
  }

  historyForm = {
    altura: null as number | null,
    peso: null as number | null,
    temperatura: null as number | null,
    presion: '' as string,
    extras: [
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' },
    ] as ClinicalHistoryExtra[],
  };

  showHistoryModal = false;
  historyAppointmentId: string | null = null;
  historyPatientId: string | null = null;
  historySpecialistId: string | null = null;
  historyResena = '';

  turnos = signal<Turno[]>([]);
  q = signal('');

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    const base = await this.svc.listSpecialist();

    const withHistory = await Promise.all(
      base.map(async (t) => {
        let historia_texto = '';

        try {
          const h = await this.history.getByAppointment(t.id);
          if (h) {
            const extrasTxt = (h.extras ?? [])
              .map((e) => `${e.key}: ${e.value}`)
              .join(' ');

            historia_texto = [
              h.altura ? `altura: ${h.altura}` : '',
              h.peso ? `peso: ${h.peso}` : '',
              h.temperatura ? `temp: ${h.temperatura}` : '',
              h.presion ? `presion: ${h.presion}` : '',
              extrasTxt,
            ]
              .filter(Boolean)
              .join(' ');
          }
        } catch (e) {
          console.warn('Error cargando historia para turno', t.id, e);
        }

        return { ...t, historia_texto };
      })
    );

    this.turnos.set(withHistory);
  }

  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    if (!q) return this.turnos();

    return this.turnos().filter((t) => {
      const hay = [
        t.fecha,
        t.hora?.slice(0, 5),
        t.especialidad_nombre ?? '',
        t.paciente_nombre ?? '',
        t.estado ?? '',
        t.resena_especialista ?? '',
        t.historia_texto ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  });

  canCancel(t: Turno) {
    return t.estado === 'PENDIENTE';
  }
  canReject(t: Turno) {
    return t.estado === 'PENDIENTE';
  }
  canAccept(t: Turno) {
    return t.estado === 'PENDIENTE';
  }
  canFinish(t: Turno) {
    return t.estado === 'ACEPTADO';
  }
  hasResena(t: Turno) {
    return !!t.resena_especialista;
  }

  async aceptar(t: Turno) {
    const { error } = await this.svc.accept(t.id);
    if (!error) await this.load();
  }

  async rechazar(t: Turno) {
    const m = prompt('Motivo rechazo:') ?? '';
    if (!m.trim()) return;
    const { error } = await this.svc.reject(t.id, m.trim());
    if (!error) await this.load();
  }

  async cancelar(t: Turno) {
    const m = prompt('Motivo cancelación:') ?? '';
    if (!m.trim()) return;
    const { error } = await this.svc.cancelAsSpecialist(t.id, m.trim());
    if (!error) await this.load();
  }

  verResena(t: Turno) {
    alert(t.resena_especialista || 'Sin reseña');
  }

  openHistoryModal(t: Turno) {
    if (!t.patient_id || !t.specialist_id) {
      alert(
        'No se puede cargar la historia clínica porque faltan datos del turno (patient_id / specialist_id).'
      );
      return;
    }

    this.historyAppointmentId = t.id;
    this.historyPatientId = t.patient_id;
    this.historySpecialistId = t.specialist_id;

    this.historyForm = {
      altura: null,
      peso: null,
      temperatura: null,
      presion: '',
      extras: [
        { key: '', value: '' },
        { key: '', value: '' },
        { key: '', value: '' },
      ],
    };
    this.historyResena = '';

    this.showHistoryModal = true;
  }

  async saveHistoryAndFinish() {
    if (
      !this.historyAppointmentId ||
      !this.historyPatientId ||
      !this.historySpecialistId
    ) {
      return;
    }

    try {
      await this.history.createForAppointment(this.historyAppointmentId!, {
        patient_id: this.historyPatientId!,
        specialist_id: this.historySpecialistId!,
        altura: this.historyForm.altura,
        peso: this.historyForm.peso,
        temperatura: this.historyForm.temperatura,
        presion: this.historyForm.presion || null,
        extras: this.historyForm.extras,
      });
    } catch (hErr) {
      console.error(hErr);
      alert('No se pudo guardar la historia clínica');
      return;
    }

    const { error: aErr } = await this.svc.finish(
      this.historyAppointmentId!,
      this.historyResena
    );

    if (aErr) {
      console.error(aErr);
      alert('No se pudo finalizar el turno');
      return;
    }

    this.showHistoryModal = false;
    await this.load();
  }
}
