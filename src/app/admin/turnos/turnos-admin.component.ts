import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Turno } from '../../core/services/appointments.service';

@Component({
  standalone: true,
  selector: 'app-turnos-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss'],
})
export class TurnosAdminComponent implements OnInit {
  private svc = inject(AppointmentsService);
  turnos = signal<Turno[]>([]);
  q = signal('');

  async ngOnInit(){ this.turnos.set(await this.svc.listAdmin()); }

  filtered = computed(() => {
    const q = this.q().toLowerCase();
    if (!q) return this.turnos();
    return this.turnos().filter(t =>
      (t.especialidad_nombre ?? '').toLowerCase().includes(q) ||
      (t.especialista_nombre ?? '').toLowerCase().includes(q)
    );
  });

  canCancel(t:Turno){ return t.estado==='PENDIENTE'; }

  async cancelar(t: Turno) {
    const m = prompt('Motivo de cancelación:') ?? '';
    if (!m.trim()) return;
    const { error } = await this.svc.adminCancel(t.id, m.trim());
    if (!error) this.turnos.set(await this.svc.listAdmin());
  }
}
