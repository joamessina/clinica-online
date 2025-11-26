import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AppointmentsService,
  Turno,
} from '../../core/services/appointments.service';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import { HistoryService } from '../../core/services/history.service';
import { CaptchaDirective } from '../../shared/directives/captcha.directive';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-mis-turnos-paciente',
  imports: [CommonModule, FormsModule, BackButtonComponent, CaptchaDirective],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss'],
})
export class MisTurnosPacienteComponent implements OnInit {
  private history = inject(HistoryService);
  private svc = inject(AppointmentsService);
  captchaEnabled = environment.captchaEnabled;
  turnos = signal<Turno[]>([]);
  q = signal('');

  // turno actualmente seleccionado para cualquier modal
  selectedTurno = signal<Turno | null>(null);

  // ----- MODAL RESEÑA -----
  showReviewModal = signal(false);
  reviewText = signal('');

  // ----- MODAL CALIFICAR -----
  showFeedbackModal = signal(false);
  feedbackRating = signal<number | null>(5);
  feedbackComment = signal('');

  // ----- MODAL CANCELAR -----
  showCancelModal = signal(false);
  cancelReason = signal('');

  // ----- MODAL ENCUESTA -----
  showSurveyModal = signal(false);
  surveyP1 = signal<'si' | 'no' | ''>('');
  surveyP2 = signal<'si' | 'no' | ''>('');
  surveyComment = signal('');

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
        (t as any).historia_texto ?? '',
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
    // mismo criterio que tenías antes
    return t.estado === 'REALIZADO' && !!t.resena_especialista;
  }
  hasResena(t: Turno) {
    return !!t.resena_especialista;
  }

  // ===== RESEÑA =====
  verResena(t: Turno) {
    this.selectedTurno.set(t);
    this.reviewText.set(
      t.resena_especialista || (t as any).resena || (t as any).comentario || ''
    );
    this.showReviewModal.set(true);
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
    this.selectedTurno.set(null);
    this.reviewText.set('');
  }

  // ===== CANCELAR TURNO =====
  cancelar(t: Turno) {
    this.selectedTurno.set(t);
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.selectedTurno.set(null);
    this.cancelReason.set('');
  }

  async submitCancelModal() {
    const turno = this.selectedTurno();
    const motivo = this.cancelReason().trim();

    if (!turno) return;

    if (!motivo) {
      alert('Ingresá un motivo para cancelar el turno.');
      return;
    }

    const { error } = await this.svc.cancelAsPatient(turno.id, motivo);
    if (error) {
      console.error('[mis-turnos] error cancelando turno', error);
      alert('No se pudo cancelar el turno. Intentalo de nuevo.');
      return;
    }

    this.closeCancelModal();
    await this.load();
  }

  // ===== CALIFICAR ATENCIÓN =====
  feedback(t: Turno) {
    this.selectedTurno.set(t);
    this.feedbackRating.set(5);
    this.feedbackComment.set('');
    this.showFeedbackModal.set(true);
  }

  closeFeedbackModal() {
    this.showFeedbackModal.set(false);
    this.selectedTurno.set(null);
    this.feedbackComment.set('');
  }

  async submitFeedbackModal() {
    const turno = this.selectedTurno();
    const rating = this.feedbackRating();
    const comment = this.feedbackComment().trim();

    if (!turno || !rating) return;

    const { error } = await this.svc.sendFeedback(
      turno.id,
      rating,
      comment || undefined
    );

    if (error) {
      console.error('[mis-turnos] error feedback', error);
      alert('No se pudo guardar la calificación.');
      return;
    }

    this.showFeedbackModal.set(false);
    this.selectedTurno.set(null);
    await this.load();
    alert('¡Gracias por calificar la atención!');
  }

  // ===== ENCUESTA =====
  abrirEncuesta(t: Turno) {
    this.selectedTurno.set(t);
    this.surveyP1.set('');
    this.surveyP2.set('');
    this.surveyComment.set('');
    this.showSurveyModal.set(true);
  }

  closeSurveyModal() {
    this.showSurveyModal.set(false);
    this.selectedTurno.set(null);
    this.surveyP1.set('');
    this.surveyP2.set('');
    this.surveyComment.set('');
  }

  async submitSurveyModal() {
    const turno = this.selectedTurno();
    const p1 = this.surveyP1();
    const p2 = this.surveyP2();
    const comentario = this.surveyComment().trim();

    if (!turno) return;

    if (!p1 || !p2) {
      alert('Completá las preguntas obligatorias.');
      return;
    }

    const payload = { p1, p2, comentario };

    const { error } = await this.svc.sendSurvey(turno.id, payload);
    if (error) {
      console.error('[mis-turnos] error encuesta', error);
      alert('No se pudo enviar la encuesta.');
      return;
    }

    this.showSurveyModal.set(false);
    this.selectedTurno.set(null);
    await this.load();
    alert('¡Encuesta enviada!');
  }
}
