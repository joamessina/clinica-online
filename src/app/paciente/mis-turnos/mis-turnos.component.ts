import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AppointmentsService,
  Turno,
} from '../../core/services/appointments.service';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';

@Component({
  standalone: true,
  selector: 'app-mis-turnos-paciente',
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss'],
})
export class MisTurnosPacienteComponent implements OnInit {
  private svc = inject(AppointmentsService);
  private router = inject(Router);
  turnos = signal<Turno[]>([]);
  q = signal('');

  async ngOnInit() {
    this.turnos.set(await this.svc.listPatient());
  }

  filtered = computed(() => {
    const q = this.q().toLowerCase();
    if (!q) return this.turnos();
    return this.turnos().filter(
      (t) =>
        (t.especialidad_nombre ?? '').toLowerCase().includes(q) ||
        (t.especialista_nombre ?? '').toLowerCase().includes(q)
    );
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
