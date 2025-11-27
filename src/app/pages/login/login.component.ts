// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { LoaderService } from '../../core/services/loader.service';
import { SpecialtyService } from '../../core/services/specialty.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

type QuickRole = 'paciente' | 'especialista' | 'admin';

interface QuickUser {
  label: string;
  role: QuickRole;
  email: string;
  password: string;
  avatar: string;
}

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private session = inject(SessionService);
  private loader = inject(LoaderService);
  private sb = inject(SupabaseClientService).client;
  private specialtySvc = inject(SpecialtyService);
  private i18n = inject(I18nService);

  private avatars = {
    paciente: this.sb.storage.from('avatars').getPublicUrl('system/user.jpg')
      .data.publicUrl,
    especialista: this.sb.storage
      .from('avatars')
      .getPublicUrl('system/doctor.jpg').data.publicUrl,
    admin: this.sb.storage.from('avatars').getPublicUrl('system/admin.jpg').data
      .publicUrl,
  };

  quickUsers: QuickUser[] = [
    {
      label: 'Paciente 1',
      role: 'paciente',
      email: 'lucamerolla124@gmail.com',
      password: '123456',
      avatar: this.avatars.paciente,
    },
    {
      label: 'Paciente 2',
      role: 'paciente',
      email: 'pepeargento@yopmail.com',
      password: '123456',
      avatar: this.avatars.paciente,
    },
    {
      label: 'Paciente 3',
      role: 'paciente',
      email: 'cockyargento@yopmail.com',
      password: '123456',
      avatar: this.avatars.paciente,
    },
    {
      label: 'Especialista 1',
      role: 'especialista',
      email: 'terala6344@fergetic.com',
      password: '123456',
      avatar: this.avatars.especialista,
    },
    {
      label: 'Especialista 2',
      role: 'especialista',
      email: 'especialista@yopmail.com',
      password: '123456',
      avatar: this.avatars.especialista,
    },
    {
      label: 'Admin',
      role: 'admin',
      email: 'joaquin.messina@gmail.com',
      password: '123456',
      avatar: this.avatars.admin,
    },
  ];

  email = '';
  password = '';

  useQuick(u: QuickUser) {
    this.email = u.email;
    this.password = u.password;
  }

  async submit() {
    await this.loader.run(async () => {
      const r = await this.auth.signInEmailChecked(this.email, this.password);
      if (!r.ok) {
        if (r.code === 'PENDIENTE') {
          alert(this.i18n.t('login.error.pending'));
        } else if (r.code === 'CREDENCIALES') {
          alert(this.i18n.t('login.error.credentials'));
        } else {
          alert(this.i18n.t('login.error.generic'));
        }
        return;
      }

      await this.session.refresh();
      await this.completarPerfilPendienteDespuesDeLogin();

      const prof = this.session.profile();
      if (!prof) {
        this.router.navigateByUrl('/paciente');
        return;
      }

      if (prof.role === 'admin') this.router.navigateByUrl('/admin/usuarios');
      else if (prof.role === 'especialista')
        this.router.navigateByUrl('/especialista');
      else this.router.navigateByUrl('/paciente');
    });
  }

  private async completarPerfilPendienteDespuesDeLogin() {
    const pendingRaw = localStorage.getItem('pendingProfile');
    const key = localStorage.getItem('reg_pending_key');
    if (!pendingRaw || !key) return;

    const payload = JSON.parse(pendingRaw);
    const uid = this.session.user()!.id;

    const bucket = this.sb.storage.from('avatars');
    const move = async (path: string | null, finalName: string) => {
      if (!path) return null;
      const dst = `profiles/${uid}/${finalName}`;
      const { error: mvErr } = await bucket.move(path, dst);
      if (mvErr) {
        console.warn('move error', mvErr.message);
        return null;
      }
      return bucket.getPublicUrl(dst).data.publicUrl;
    };

    let avatarUrl: string | null = null;
    let extraUrl: string | null = null;
    if (payload.rol === 'paciente') {
      avatarUrl = await move(payload.avatarPath1, 'avatar.jpg');
      extraUrl = await move(payload.avatarPath2, 'extra.jpg');
    } else {
      avatarUrl = await move(payload.avatarPath1, 'avatar.jpg');
    }

    let finalSpecialtyId: string | null = null;
    if (payload.rol === 'especialista') {
      if (payload.specialtyId === '-1') {
        finalSpecialtyId = String(
          await this.specialtySvc.ensure(payload.specialtyOther)
        );
      } else if (payload.specialtyId) {
        finalSpecialtyId = String(payload.specialtyId);
      }
    }

    const { error: upErr } = await this.sb.from('profiles').upsert(
      {
        id: uid,
        role: payload.rol,
        nombre: payload.nombre,
        apellido: payload.apellido,
        edad: payload.edad,
        dni: payload.dni,
        obra_social: payload.rol === 'paciente' ? payload.obra_social : null,
        is_approved: payload.rol === 'especialista' ? false : true,
        email: this.email,
        avatar_url: avatarUrl,
        extra_img_url: payload.rol === 'paciente' ? extraUrl ?? null : null,
      },
      { onConflict: 'id' }
    );

    if (upErr) console.warn('upsert profile error:', upErr.message);

    if (payload.rol === 'especialista' && finalSpecialtyId) {
      const { error: linkErr } = await this.sb
        .from('profile_specialty')
        .upsert(
          { profile_id: uid, specialty_id: finalSpecialtyId },
          { onConflict: 'profile_id,specialty_id' }
        );
      if (linkErr) console.warn('link especialidad error:', linkErr.message);
    }

    localStorage.removeItem('pendingProfile');
    localStorage.removeItem('reg_pending_key');
  }
}
