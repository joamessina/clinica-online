import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';

type Perfil = {
  id: string;
  role: 'paciente' | 'especialista' | 'admin';
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  dni: string | null;
  edad: number | null;
  obra_social: string | null;
  avatar_url: string | null;
  specialties?: { id: string; nombre: string }[];
};

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, BackButtonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private auth = inject(AuthService);

  perfil = signal<Perfil | null>(null);
  loading = signal(true);

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    if (!user) return;

    // perfil base
    const { data: p } = await this.sb
      .from('profiles')
      .select(
        'id, role, nombre, apellido, email, dni, edad, obra_social, avatar_url'
      )
      .eq('id', user.id)
      .maybeSingle();

    // especialidades (si es especialista)
    let specs: { id: string; nombre: string }[] = [];
    if (p?.role === 'especialista') {
      const { data: rows } = await this.sb
        .from('profile_specialty')
        .select('specialty: specialty_id (id, nombre)')
        .eq('profile_id', user.id);

      specs = (rows ?? []).map((r: any) => r.specialty).filter(Boolean);
    }

    const avatar = p?.avatar_url
      ? this.sb.storage.from('avatars').getPublicUrl(p.avatar_url).data
          .publicUrl
      : this.sb.storage.from('avatars').getPublicUrl('system/user.jpg').data
          .publicUrl;

    this.perfil.set({
      ...(p as Perfil),
      avatar_url: avatar,
      specialties: specs,
    });
    this.loading.set(false);
  }
}
