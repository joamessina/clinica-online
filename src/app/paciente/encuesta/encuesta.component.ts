import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsService } from '../../core/services/appointments.service';

@Component({
  standalone: true,
  selector: 'app-encuesta-paciente',
  imports: [CommonModule, FormsModule],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.scss'],
})
export class EncuestaPacienteComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(AppointmentsService);

  appId = this.route.snapshot.paramMap.get('id')!;
  // Ejemplo de 3 preguntas simples
  p1: 'si'|'no'|'' = '';
  p2: 'si'|'no'|'' = '';
  p3: string = '';

  async enviar() {
    if (!this.p1 || !this.p2) { alert('Completá las preguntas.'); return; }
    const payload = { p1: this.p1, p2: this.p2, comentario: this.p3 };
    const { error } = await this.svc.sendSurvey(this.appId, payload);
    if (error) { alert(error.message); return; }
    alert('¡Encuesta enviada!');
    this.router.navigateByUrl('/paciente/mis-turnos');
  }
}
