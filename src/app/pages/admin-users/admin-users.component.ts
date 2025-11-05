import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';

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
  specialtyName?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private avatarsBucket = this.sb.storage.from('avatars');

  readonly placeholderUrl = this.avatarsBucket.getPublicUrl(
    'system/userPlaceholder.png'
  ).data.publicUrl;

  loading = signal(true);
  q = signal('');
  role = signal<'all' | Role>('all');
  onlyPending = signal(false);

  rows = signal<AdminUser[]>([]);

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
        'id,nombre,apellido,email,dni,obra_social,role,is_approved,avatar_url,profile_specialty:profile_specialty (specialties:specialties ( nombre ))'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users] load error', error);
      this.rows.set([]);
    } else {
      const mapped = (data ?? []).map((r: any) => {
        const row: AdminUser = {
          id: r.id,
          nombre: r.nombre,
          apellido: r.apellido,
          email: r.email,
          dni: r.dni,
          obra_social: r.obra_social,
          role: r.role,
          is_approved: r.is_approved,
          avatar_url: this.normalizeAvatar(r.avatar_url ?? null),
          specialtyName: r.profile_specialty?.[0]?.specialties?.nombre ?? null,
        };
        return row;
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
}
