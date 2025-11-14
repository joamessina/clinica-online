import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  HistoryService,
  ClinicalHistory,
} from '../../core/services/history.service';

type Role = 'admin' | 'especialista' | 'paciente';

interface AdminUser {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  dni: string | null;
  obra_social: string | null;
  role: Role;
  is_approved: boolean;
  avatar_url?: string | null;
  specialties?: string[];
}

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private avatarsBucket = this.sb.storage.from('avatars');
  private history = inject(HistoryService);

  readonly placeholderUrl = this.avatarsBucket.getPublicUrl(
    'system/userPlaceholder.png'
  ).data.publicUrl;

  loading = signal(true);
  q = signal('');
  role = signal<'all' | Role>('all');
  onlyPending = signal(false);

  rows = signal<AdminUser[]>([]);
  showHistory = signal(false);
  historyLoading = signal(false);
  historyRows = signal<ClinicalHistory[]>([]);
  historyPatientName = signal('');

  showCreate = signal(false);
  creating = signal(false);
  submitted = signal(false);

  newUser = signal<{
    role: Role;
    nombre: string;
    apellido: string;
    edad: number | null;
    dni: string;
    obra_social: string;
    email: string;
    password: string;
  }>({
    role: 'paciente',
    nombre: '',
    apellido: '',
    edad: null,
    dni: '',
    obra_social: '',
    email: '',
    password: '',
  });

  openCreate() {
    this.submitted.set(false);
    this.showCreate.set(true);
  }
  closeCreate() {
    this.showCreate.set(false);
  }

  async createUser() {
    this.submitted.set(true);
    const u = this.newUser();

    if (!u.nombre || !u.email || !u.password) return;
    if (u.role === 'paciente' && !u.obra_social) return;

    this.creating.set(true);

    const { error } = await this.sb.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          role: u.role,
          nombre: u.nombre,
          apellido: u.apellido,
          edad: u.edad,
          dni: u.dni,
          obra_social: u.role === 'paciente' ? u.obra_social : null,
        },
      },
    });

    this.creating.set(false);

    if (error) {
      alert('No se pudo crear el usuario: ' + error.message);
      return;
    }

    await this.load();
    this.showCreate.set(false);
    this.newUser.set({
      role: 'paciente',
      nombre: '',
      apellido: '',
      edad: null,
      dni: '',
      obra_social: '',
      email: '',
      password: '',
    });
    alert(
      'Usuario creado. Se envió email de confirmación (si está habilitado).'
    );
  }

  exportExcel() {
    const rows = this.rows();

    if (!rows.length) {
      alert('No hay usuarios para exportar.');
      return;
    }

    const data = rows.map((r) => ({
      Nombre: r.nombre ?? '',
      Apellido: r.apellido ?? '',
      Email: r.email ?? '',
      DNI: r.dni ?? '',
      'Obra social': r.obra_social ?? '',
      Rol: r.role,
      Aprobado: r.is_approved ? 'Sí' : 'No',
      Especialidades: r.specialties?.join(', ') ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const fileName = `usuarios_clinica_${yyyy}${mm}${dd}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    const role = this.role();
    const onlyPending = this.onlyPending();
    return this.rows()
      .filter((r) => (role === 'all' ? true : r.role === role))
      .filter((r) => (onlyPending ? !r.is_approved : true))
      .filter((r) => {
        if (!term) return true;
        const hay = [
          r.nombre ?? '',
          r.apellido ?? '',
          r.email ?? '',
          r.dni ?? '',
          r.obra_social ?? '',
          r.role,
          ...(r.specialties ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      });
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

  imgFallback(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.placeholderUrl;
  }

  async load() {
    this.loading.set(true);

    const { data, error } = await this.sb
      .from('profiles')
      .select(
        `
      id,nombre,apellido,email,dni,obra_social,role,is_approved,avatar_url,
      profile_specialty:profile_specialty (
        specialties:specialties ( nombre )
      )
    `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users] load error', error);
      this.rows.set([]);
    } else {
      const mapped = (data ?? []).map((r: any): AdminUser => {
        const specialties: string[] =
          r.profile_specialty
            ?.map((ps: any) => ps?.specialties?.nombre)
            .filter(Boolean) ?? [];

        return {
          id: r.id,
          nombre: r.nombre,
          apellido: r.apellido,
          email: r.email,
          dni: r.dni,
          obra_social: r.obra_social,
          role: r.role,
          is_approved: r.is_approved,
          avatar_url: this.normalizeAvatar(r.avatar_url ?? null),
          specialties,
        };
      });

      this.rows.set(mapped);
    }
    this.loading.set(false);
  }

  nameOf(r: AdminUser) {
    const n = (r.nombre ?? '').trim();
    const a = (r.apellido ?? '').trim();
    return n || a ? `${n} ${a}`.trim() : '—';
  }

  async toggleApprove(r: AdminUser) {
    const next = !r.is_approved;
    const { error } = await this.sb
      .from('profiles')
      .update({ is_approved: next })
      .eq('id', r.id);
    if (error) return alert('No se pudo actualizar aprobación');
    r.is_approved = next;
    this.rows.set([...this.rows()]);
  }

  async setRole(r: AdminUser, role: Role) {
    if (r.role === role) return;
    const { error } = await this.sb
      .from('profiles')
      .update({ role })
      .eq('id', r.id);
    if (error) return alert('No se pudo actualizar el rol');
    r.role = role;
    this.rows.set([...this.rows()]);
  }

  async openHistory(r: AdminUser) {
    if (r.role !== 'paciente') {
      return;
    }

    this.historyPatientName.set(
      `${(r.nombre || '').trim()} ${(r.apellido || '').trim()}`.trim() ||
        r.email ||
        'Paciente'
    );
    this.showHistory.set(true);
    this.historyLoading.set(true);
    this.historyRows.set([]);

    try {
      const rows = await this.history.listForPatientAdmin(r.id);
      this.historyRows.set(rows);
    } catch (e) {
      console.error('[admin/users] history error', e);
      alert('No se pudo cargar la historia clínica del paciente.');
    } finally {
      this.historyLoading.set(false);
    }
  }

  closeHistory() {
    this.showHistory.set(false);
    this.historyRows.set([]);
  }
}
