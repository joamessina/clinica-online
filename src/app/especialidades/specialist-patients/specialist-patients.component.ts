import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AppointmentsService,
  Turno,
  TurnoEstado,
} from '../../core/services/appointments.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';

interface PacienteAtendido {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  dni: string | null;
  obra_social: string | null;
  avatar_url: string;
  totalConsultas: number;
}

interface ConsultaPaciente {
  id: string;
  fecha: string;
  hora: string;
  especialidad: string | null;
  estado: TurnoEstado;
  resena_especialista: string | null;
}

@Component({
  standalone: true,
  selector: 'app-specialist-patients',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './specialist-patients.component.html',
  styleUrls: ['./specialist-patients.component.scss'],
})
export class SpecialistPatientsComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private appts = inject(AppointmentsService);

  private avatarsBucket = this.sb.storage.from('avatars');

  readonly placeholderUrl = this.avatarsBucket.getPublicUrl(
    'system/userPlaceholder.png'
  ).data.publicUrl;

  loading = signal(true);
  search = signal('');
  pacientes = signal<PacienteAtendido[]>([]);
  selectedPatientId = signal<string | null>(null);

  consultasByPatient = signal<Record<string, ConsultaPaciente[]>>({});

  filteredPatients = computed(() => {
    const term = this.search().toLowerCase().trim();
    const all = this.pacientes();
    if (!term) return all;
    return all.filter((p) => {
      const texto = [
        p.nombre,
        p.apellido,
        p.email ?? '',
        p.dni ?? '',
        p.obra_social ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return texto.includes(term);
    });
  });

  consultasSeleccionado = computed(() => {
    const id = this.selectedPatientId();
    if (!id) return [];
    return this.consultasByPatient()[id] ?? [];
  });

  pacienteSeleccionado = computed(() => {
    const id = this.selectedPatientId();
    if (!id) return null;
    return this.pacientes().find((p) => p.id === id) ?? null;
  });

  async ngOnInit() {
    await this.load();
  }

  private normalizeAvatar(path: string | null): string {
    if (!path) return this.placeholderUrl;
    if (/^https?:\/\//i.test(path)) return path;
    return (
      this.avatarsBucket.getPublicUrl(path).data.publicUrl ||
      this.placeholderUrl
    );
  }

  async load() {
    this.loading.set(true);

    try {
      const turnos: Turno[] = await this.appts.listSpecialist();

      const realizados = turnos.filter(
        (t) => t.estado === 'REALIZADO' && !!t.patient_id
      );

      if (!realizados.length) {
        this.pacientes.set([]);
        this.consultasByPatient.set({});
        this.selectedPatientId.set(null);
        return;
      }

      const ids = Array.from(
        new Set(
          realizados.map((t) => t.patient_id as string).filter((v) => !!v)
        )
      );

      const { data: profiles, error } = await this.sb
        .from('profiles')
        .select('id, nombre, apellido, email, dni, obra_social, avatar_url')
        .in('id', ids);

      if (error) {
        console.error('[mis-pacientes] error cargando perfiles', error);
        this.pacientes.set([]);
        this.consultasByPatient.set({});
        this.selectedPatientId.set(null);
        return;
      }

      const perfilMap = new Map<string, any>();
      (profiles ?? []).forEach((p) => perfilMap.set(p.id, p));

      const byPatient: Record<string, ConsultaPaciente[]> = {};

      for (const t of realizados) {
        const pid = t.patient_id as string;
        if (!byPatient[pid]) {
          byPatient[pid] = [];
        }
        byPatient[pid].push({
          id: t.id,
          fecha: t.fecha,
          hora: t.hora,
          especialidad: t.especialidad_nombre ?? null,
          estado: t.estado,
          resena_especialista: (t as any).resena_especialista ?? null,
        });
      }

      Object.values(byPatient).forEach((arr) =>
        arr.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
      );

      const pacientes: PacienteAtendido[] = ids.map((id) => {
        const p = perfilMap.get(id);
        const totalConsultas = byPatient[id]?.length ?? 0;

        return {
          id,
          nombre: (p?.nombre as string) ?? 'Paciente',
          apellido: (p?.apellido as string) ?? '',
          email: (p?.email as string) ?? null,
          dni: (p?.dni as string) ?? null,
          obra_social: (p?.obra_social as string) ?? null,
          avatar_url: this.normalizeAvatar(p?.avatar_url ?? null),
          totalConsultas,
        };
      });

      // Orden alfabético
      pacientes.sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(
          `${b.nombre} ${b.apellido}`,
          'es'
        )
      );

      this.pacientes.set(pacientes);
      this.consultasByPatient.set(byPatient);
      this.selectedPatientId.set(pacientes.length ? pacientes[0].id : null);
    } finally {
      this.loading.set(false);
    }
  }

  seleccionarPaciente(id: string) {
    this.selectedPatientId.set(id);
  }

  imgFallback(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.placeholderUrl;
  }
}
