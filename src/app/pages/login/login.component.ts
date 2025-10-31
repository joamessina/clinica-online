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

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
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
  
  email = '';
  password = '';

  async submit() {
    await this.loader.run(async () => {
      const { error } = await this.auth.signInEmail(this.email, this.password);
      if (error) {
        alert(error.message);
        return;
      }

      await this.session.refresh();
      await this.completarPerfilPendienteDespuesDeLogin();

      const prof = this.session.profile();
      console.log('[login] profile ->', prof);

      if (!prof) {
        this.router.navigateByUrl('/paciente');
        return;
      }

      if (prof.role === 'especialista' && !prof.is_approved) {
        alert('Pendiente de aprobación.');
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

  // mover imágenes pending -> profiles y obtener URL pública final
  const bucket = this.sb.storage.from('avatars');
  const move = async (path: string | null, finalName: string) => {
    if (!path) return null;
    const dst = `profiles/${uid}/${finalName}`;
    // move = copy + delete bajo el capó; con policies de arriba funciona
    const { error: mvErr } = await bucket.move(path, dst);
    if (mvErr) { console.warn('move error', mvErr.message); return null; }
    return bucket.getPublicUrl(dst).data.publicUrl;
  };

  let avatarUrl: string | null = null;
  let extraUrl: string | null = null;
  if (payload.rol === 'paciente') {
    avatarUrl = await move(payload.avatarPath1, 'avatar.jpg');
    extraUrl  = await move(payload.avatarPath2, 'extra.jpg');
  } else {
    avatarUrl = await move(payload.avatarPath1, 'avatar.jpg');
  }

  // resolver especialidad si es especialista
  let finalSpecialtyId: string | null = null;
  if (payload.rol === 'especialista') {
    if (payload.specialtyId === '-1') {
      finalSpecialtyId = String(await this.specialtySvc.ensure(payload.specialtyOther));
    } else if (payload.specialtyId) {
      finalSpecialtyId = String(payload.specialtyId);
    }
  }

  // upsert del perfil ahora que tenés session (RLS: id = auth.uid())
  const { error: upErr } = await this.sb.from('profiles').upsert({
    id: uid,
    role: payload.rol,
    nombre: payload.nombre,
    apellido: payload.apellido,
    edad: payload.edad,
    dni: payload.dni,
    obra_social: payload.rol === 'paciente' ? payload.obra_social : null,
    is_approved: payload.rol === 'especialista' ? false : true,
    email: this.email,         // si guardás email en profiles
    avatar_url: avatarUrl,
    extra_img_url: payload.rol === 'paciente' ? (extraUrl ?? null) : null,
  }, { onConflict: 'id' });

  if (upErr) console.warn('upsert profile error:', upErr.message);

  // vincular especialidad si aplica (tabla profile_specialty)
  if (payload.rol === 'especialista' && finalSpecialtyId) {
    const { error: linkErr } = await this.sb
      .from('profile_specialty')
      .upsert({ profile_id: uid, specialty_id: finalSpecialtyId }, { onConflict: 'profile_id,specialty_id' });
    if (linkErr) console.warn('link especialidad error:', linkErr.message);
  }

  // limpiar pendientes
  localStorage.removeItem('pendingProfile');
  localStorage.removeItem('reg_pending_key');
}

}
