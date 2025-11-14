import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AppointmentsService,
  Turno,
} from '../../core/services/appointments.service';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { HistoryService } from '../../core/services/history.service';

@Component({
  standalone: true,
  selector: 'app-mis-turnos-paciente',
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss'],
})
export class MisTurnosPacienteComponent implements OnInit {
  private history = inject(HistoryService);
  private svc = inject(AppointmentsService);
  private router = inject(Router);
  turnos = signal<Turno[]>([]);
  q = signal('');

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    const base = await this.svc.listPatient();

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
        t.especialista_nombre ?? '',
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
    return ['PENDIENTE', 'ACEPTADO'].includes(t.estado);
  }
  canFeedback(t: Turno) {
    return t.estado === 'REALIZADO';
  }
  canSurvey(t: Turno) {
    return t.estado === 'REALIZADO' && !!t.resena_especialista;
  }
  hasResena(t: Turno) {
    return !!t.resena_especialista;
  }

  async cancelar(t: Turno) {
    const motivo = prompt('Motivo de cancelación:') ?? '';
    if (!motivo.trim()) return;
    const { error } = await this.svc.cancelAsPatient(t.id, motivo.trim());
    if (!error) this.turnos.set(await this.svc.listPatient());
  }

  async feedback(t: Turno) {
    const cal = Number(prompt('Calificación 1 a 5:') ?? '0');
    if (cal < 1 || cal > 5) return;
    const comentario = prompt('Comentario (opcional):') ?? null;
    const { error } = await this.svc.sendFeedback(
      t.id,
      cal,
      comentario ?? undefined
    );
    if (!error) alert('¡Gracias por calificar!');
  }

  abrirEncuesta(t: Turno) {
    this.router.navigate(['/paciente/encuesta', t.id]);
  }
  verResena(t: Turno) {
    alert(t.resena_especialista || 'Sin reseña');
  }
}
