import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Turno } from '../../core/services/appointments.service';

@Component({
  standalone: true,
  selector: 'app-mis-turnos-especialista',
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss'],
})
export class MisTurnosEspecialistaComponent implements OnInit {
  private svc = inject(AppointmentsService);
  turnos = signal<Turno[]>([]);
  q = signal('');

  async ngOnInit(){ this.turnos.set(await this.svc.listSpecialist()); }

  filtered = computed(() => {
    const q = this.q().toLowerCase();
    if (!q) return this.turnos();
    return this.turnos().filter(t =>
      (t.especialidad_nombre ?? '').toLowerCase().includes(q) ||
      (t.paciente_nombre ?? '').toLowerCase().includes(q)
    );
  });

  canCancel(t:Turno){ return t.estado==='PENDIENTE'; }
  canReject(t:Turno){ return t.estado==='PENDIENTE'; }
  canAccept(t:Turno){ return t.estado==='PENDIENTE'; }
  canFinish(t:Turno){ return t.estado==='ACEPTADO'; }
  hasResena(t:Turno){ return !!t.resena_especialista; }

  async aceptar(t:Turno){ const {error}=await this.svc.accept(t.id); if(!error)this.turnos.set(await this.svc.listSpecialist()); }
  async rechazar(t:Turno){
    const m=prompt('Motivo rechazo:')??''; if(!m.trim())return;
    const {error}=await this.svc.reject(t.id,m.trim()); if(!error)this.turnos.set(await this.svc.listSpecialist());
  }
  async cancelar(t:Turno){
    const m=prompt('Motivo cancelación:')??''; if(!m.trim())return;
    const {error}=await this.svc.cancelAsSpecialist(t.id,m.trim()); if(!error)this.turnos.set(await this.svc.listSpecialist());
  }
  async finalizar(t:Turno){
    const r=prompt('Reseña/diagnóstico:')??''; if(!r.trim())return;
    const {error}=await this.svc.finish(t.id,r.trim()); if(!error)this.turnos.set(await this.svc.listSpecialist());
  }
  verResena(t:Turno){ alert(t.resena_especialista || 'Sin reseña'); }
}
