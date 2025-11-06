import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LoaderService } from '../../core/services/loader.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AuthService } from '../../core/services/auth.service';
import { SpecialtyService } from '../../core/services/specialty.service';
import { ToastService } from '../../core/services/toast.service';

type Rol = 'paciente' | 'especialista';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})

export class RegisterComponent implements OnInit {
  selectedSpecialtyId: any;
  especialidadNueva: any;
  loading: any;
  addSpecialty() {
    throw new Error('Method not implemented.');
  }
  private loader = inject(LoaderService);
  private router = inject(Router);
  private sb = inject(SupabaseClientService).client;
  private auth = inject(AuthService);
  private specialtySvc = inject(SpecialtyService);
  private toast = inject(ToastService);

  rol: Rol | null = null;

  patientImgUrl = this.sb.storage.from('avatars').getPublicUrl('system/user.jpg').data.publicUrl;
  specialistImgUrl = this.sb.storage.from('avatars').getPublicUrl('system/especialidad.jpg').data.publicUrl;

  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obra_social = '';
  email = '';
  password = '';

  specialties = signal<{ id: string; nombre: string }[]>([]);
  specialtyId: string | null = null;
  specialtyOther = '';

  foto1?: File;
  foto2?: File;
  fotoEsp?: File;

  ngOnInit() {
    this.cargarEspecialidades();
  }

  chooseRole(role: Rol) {
    this.rol = role;
  }

  async cargarEspecialidades() {
    try {
      const { data, error } = await this.specialtySvc.listActive();
      if (!error) {
        this.specialties.set(
          (data ?? []).map((d: any) => ({ id: d.id, nombre: d.nombre }))
        );
      }
    } catch {}
  }

  onFileChange(which: 'p1' | 'p2' | 'esp', ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || undefined;
    if (which === 'p1') this.foto1 = file;
    if (which === 'p2') this.foto2 = file;
    if (which === 'esp') this.fotoEsp = file;
  }

  get isEspecialista() {
    return this.rol === 'especialista';
  }
  

  private validar(): string | null {
    if (!this.nombre.trim()) return 'Nombre requerido';
    if (!this.apellido.trim()) return 'Apellido requerido';
    if (!this.edad || this.edad <= 0) return 'Edad inválida';
    if (!/^\d{6,}$/.test(this.dni)) return 'DNI inválido';
    if (!/^\S+@\S+\.\S+$/.test(this.email)) return 'Email inválido';
    if ((this.password ?? '').length < 6)
      return 'Contraseña mínima 6 caracteres';

    if (this.rol === 'paciente') {
      if (!this.obra_social.trim()) return 'Obra social requerida';
      if (!this.foto1 || !this.foto2)
        return 'Pacientes: subí 2 imágenes de perfil';
    } else {
      const eligioOtra = this.selectedSpecialtyId === '-1';
      if (!eligioOtra && !this.selectedSpecialtyId)
        return 'Elegí una especialidad';
      if (eligioOtra && !this.especialidadNueva.trim())
        return 'Ingresá la nueva especialidad';
      if (!this.fotoEsp) return 'Especialistas: subí una imagen de perfil';
    }
    return null;
  }
  async submit() {
    const msg = this.validar();
    if (msg) {
      this.toast.error(msg);
      return;
    }

    await this.loader.run(async () => {
      const bucket = this.sb.storage.from('avatars');
      const folder = `pending/${
        crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
      }`;

      const upload = async (file: File | undefined, name: string) => {
        if (!file) return null;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${folder}/${name}-${Date.now()}.${ext}`;
        const { error: upErr } = await bucket.upload(path, file, {
          upsert: true,
        });
        if (upErr) throw upErr;
        return path;
      };

      let avatarPath1: string | null = null;
      let avatarPath2: string | null = null;
      try {
        if (this.rol === 'paciente') {
          avatarPath1 = await upload(this.foto1, 'paciente-1');
          avatarPath2 = await upload(this.foto2, 'paciente-2');
        } else {
          avatarPath1 = await upload(this.fotoEsp, 'especialista');
        }
      } catch (e: any) {
        console.warn('[register] upload pending error:', e?.message || e);
      }
      
      

      // 2) Upsert seguro vía RPC (antes del signUp)
      const { error: ppErr } = await this.sb.rpc('upsert_pending_profile', {
        _email: this.email.trim().toLowerCase(),
        _rol: this.rol,
        _nombre: this.nombre.trim(),
        _apellido: this.apellido.trim(),
        _edad: this.edad!,
        _dni: this.dni.trim(),
        _obra_social: this.rol === 'paciente' ? this.obra_social.trim() : null,
        _specialty_id:
          this.rol === 'especialista' ? this.selectedSpecialtyId ?? null : null,
        _specialty_other:
          this.rol === 'especialista' && this.selectedSpecialtyId === '-1'
            ? this.specialtyOther.trim() || null
            : null,
        _avatar_path1: avatarPath1,
        _avatar_path2: this.rol === 'paciente' ? avatarPath2 : null,
      });

      if (ppErr) {
        console.warn('[register] rpc upsert_pending_profile error:', ppErr);
        this.toast.error('No se pudo preparar el registro');
        return;
      }

      const { data: dniTaken, error: dniChkErr } = await this.sb.rpc(
        'dni_exists',
        {
          _dni: this.dni.trim(),
        }
      );
      if (dniChkErr) {
        console.warn('[register] dni_exists error:', dniChkErr);
        this.toast.error('No se pudo validar el DNI. Intentá de nuevo.');
        return;
      }
      if (dniTaken) {
        this.toast.error('Ese DNI ya está registrado.');
        return;
      }

      // 3) SignUp con metadata (el trigger lee estos campos)
      const { error: signErr } = await this.sb.auth.signUp({
        email: this.email.trim().toLowerCase(),
        password: this.password,
        options: {
          data: {
            rol: this.rol,
            nombre: this.nombre.trim(),
            apellido: this.apellido.trim(),
            edad: this.edad,
            dni: this.dni.trim(),
            obra_social:
              this.rol === 'paciente' ? this.obra_social.trim() : null,
            avatar_path1: avatarPath1, 
            avatar_path2: this.rol === 'paciente' ? avatarPath2 : null, 
          },
        },
      });

      if (signErr) {
        this.toast.error(signErr.message);
        return;
      }

      this.toast.success(
        'Te enviamos un correo para confirmar la cuenta. Luego iniciá sesión para completar el perfil.'
      );
      this.router.navigateByUrl('/login');
    }, 'register');
  }
}
