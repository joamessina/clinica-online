import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialtyService } from '../../core/services/specialty.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';

@Component({
  standalone: true,
  selector: 'app-mis-horarios',
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
})
export class MisHorariosComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private specSvc = inject(SpecialtyService);

  specialties: any[] = [];
  avail: any[] = [];

  // índice de la fila que entra en conflicto (para marcarla en la tabla)
  conflictIndex: number | null = null;

  form = {
    specialty: null as string | null,
    weekday: 1,
    desde: '09:00',
    hasta: '12:00',
    slot: 30,
  };

  async ngOnInit() {
    const { data } = await this.specSvc.listActive();
    this.specialties = data ?? [];
    await this.loadAvail();
  }

  async loadAvail() {
    const { data } = await this.sb
      .from('v_availability_me')
      .select('*')
      .order('weekday');
    this.avail = data ?? [];
  }

  // --- Helpers ---

  weekdayLabel(w: number): string {
    const labels = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    return labels[w] ?? '';
  }

  private toMinutes(hhmm: string): number {
    // acepta "HH:mm" o "HH:mm:ss"
    const [hStr, mStr] = hhmm.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  }

  /** Valida formato, rango y solapamiento con tramos ya cargados */
  private validateOverlap(): boolean {
    const start = this.toMinutes(this.form.desde);
    const end = this.toMinutes(this.form.hasta);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      alert('Las horas deben tener formato HH:mm, por ejemplo 09:00.');
      return false;
    }

    if (end <= start) {
      alert('La hora "Hasta" debe ser mayor que la hora "Desde".');
      return false;
    }

    const weekday = this.form.weekday;

    // Limpiamos conflicto previo
    this.conflictIndex = null;

    const idx = this.avail.findIndex((a) => {
      if (a.weekday !== weekday) return false;

      const aStart = this.toMinutes(a.hora_desde);
      const aEnd = this.toMinutes(a.hora_hasta);

      if (Number.isNaN(aStart) || Number.isNaN(aEnd)) return false;

      // NO hay solapamiento cuando el nuevo tramo termina antes de que empiece el otro
      // o empieza después de que termine el otro.
      const noOverlap = end <= aStart || start >= aEnd;
      return !noOverlap;
    });

    if (idx !== -1) {
      this.conflictIndex = idx;
      const c = this.avail[idx];

      alert(
        `Ya tenés un tramo ese día que se superpone:\n` +
          `• ${this.weekdayLabel(c.weekday)} ${c.hora_desde} – ${
            c.hora_hasta
          }\n\n` +
          `Ajustá el horario o el día antes de agregar uno nuevo.`
      );
      return false;
    }

    return true;
  }

  // --- Alta de tramo ---

  async add() {
    if (!this.form.specialty) {
      alert('Elegí una especialidad antes de agregar un tramo.');
      return;
    }

    // refuerzo: slot mínimo 30
    if (!this.form.slot || this.form.slot < 30) {
      alert('El slot mínimo es de 30 minutos.');
      this.form.slot = 30;
      return;
    }

    // validar horas y solapamientos
    if (!this.validateOverlap()) {
      return;
    }

    const { error } = await this.sb.rpc('fn_add_availability', {
      _specialty: this.form.specialty,
      _weekday: this.form.weekday,
      _desde: this.form.desde + ':00',
      _hasta: this.form.hasta + ':00',
      _slot: this.form.slot,
    });

    if (error) {
      alert(error.message);
      return;
    }

    this.conflictIndex = null;
    await this.loadAvail();
  }
}
