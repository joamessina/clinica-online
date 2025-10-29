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

  // UI state
  loading = signal(true);
  q = signal('');
  role = signal<'all' | Role>('all');
  onlyPending = signal(false);

  // data
  rows = signal<AdminUser[]>([]);

  // computed view
  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    const role = this.role();
    const onlyPending = this.onlyPending();

    return this.rows()
      .filter(r => role === 'all' ? true : r.role === role)
      .filter(r => (onlyPending ? !r.is_approved : true))
      .filter(r => {
        if (!term) return true;
        const hay = [
          r.nombre ?? '',
          r.apellido ?? '',
          r.email ?? '',
          r.dni ?? '',
          r.obra_social ?? '',
          r.role,
        ].join(' ').toLowerCase();
        return hay.includes(term);
      });
  });

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('profiles')
      .select('id,nombre,apellido,email,dni,obra_social,role,is_approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users] load error', error);
      this.rows.set([]);
    } else {
      this.rows.set((data ?? []) as AdminUser[]);
    }
    this.loading.set(false);
  }

  nameOf(r: AdminUser) {
    const n = (r.nombre ?? '').trim();
    const a = (r.apellido ?? '').trim();
    return (n || a) ? `${n} ${a}`.trim() : '—';
  }

  async toggleApprove(r: AdminUser) {
    const next = !r.is_approved;
    const { error } = await this.sb.from('profiles').update({ is_approved: next }).eq('id', r.id);
    if (error) return alert('No se pudo actualizar aprobación');
    r.is_approved = next;
    this.rows.set([...this.rows()]);
  }

  async setRole(r: AdminUser, role: Role) {
    if (r.role === role) return;
    const { error } = await this.sb.from('profiles').update({ role }).eq('id', r.id);
    if (error) return alert('No se pudo actualizar el rol');
    r.role = role;
    this.rows.set([...this.rows()]);
  }
}
