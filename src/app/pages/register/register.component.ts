import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LoaderService } from '../../core/services/loader.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AuthService } from '../../core/services/auth.service';
import { SpecialtyService } from '../../core/services/specialty.service';

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

  // form
  rol: Rol = 'paciente';
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obra_social = '';
  email = '';
  password = '';

  specialties = signal<{ id: string; nombre: string }[]>([]);
  specialtyId: string | null = null;   // "-1" = otra
  specialtyOther = '';

  // files
  foto1?: File;      // paciente: principal
  foto2?: File;      // paciente: extra
  fotoEsp?: File;    // especialista: avatar

  ngOnInit() {
    this.cargarEspecialidades();
  }

  async cargarEspecialidades() {
    try {
      const { data, error } = await this.specialtySvc.listActive();
      if (!error) {
        this.specialties.set((data ?? []).map((d: any) => ({ id: d.id, nombre: d.nombre })));
      }
    } catch { /* noop */ }
  }

  onFileChange(which: 'p1' | 'p2' | 'esp', ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || undefined;
    if (which === 'p1') this.foto1 = file;
    if (which === 'p2') this.foto2 = file;
    if (which === 'esp') this.fotoEsp = file;
  }

  get isEspecialista() { return this.rol === 'especialista'; }

  private validar(): string | null {
    if (!this.nombre.trim()) return 'Nombre requerido';
    if (!this.apellido.trim()) return 'Apellido requerido';
    if (!this.edad || this.edad <= 0) return 'Edad inválida';
    if (!/^\d{6,}$/.test(this.dni)) return 'DNI inválido';
    if (!/^\S+@\S+\.\S+$/.test(this.email)) return 'Email inválido';
    if ((this.password ?? '').length < 6) return 'Contraseña mínima 6 caracteres';

    if (this.rol === 'paciente') {
      if (!this.obra_social.trim()) return 'Obra social requerida';
      if (!this.foto1 || !this.foto2) return 'Pacientes: subí 2 imágenes de perfil';
    } else {
      const eligioOtra = this.specialtyId === '-1';
      if (!eligioOtra && !this.specialtyId) return 'Elegí una especialidad';
      if (eligioOtra && !this.specialtyOther.trim()) return 'Ingresá la nueva especialidad';
      if (!this.fotoEsp) return 'Especialistas: subí una imagen de perfil';
    }
    return null;
  }

  async submit() {
    const msg = this.validar();
    if (msg) { alert(msg); return; }

    await this.loader.run(async () => {
      // 1) Crear usuario (envía mail). No hay session hasta confirmar.
      const { data: signup, error } = await this.auth.signUpEmail(this.email, this.password);
      if (error) { alert(error.message); return; }

      // 2) Subir imágenes a 'avatars/pending/<clave>/...'
      const pendingKey =
        localStorage.getItem('reg_pending_key') ??
        (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
      localStorage.setItem('reg_pending_key', pendingKey);

      const bucket = this.sb.storage.from('avatars');
      const folder = `pending/${pendingKey}`;

      const upload = async (file: File | undefined, name: string) => {
        if (!file) return null;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${folder}/${name}-${Date.now()}.${ext}`;
        const { error: upErr } = await bucket.upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        return path; // guardamos el PATH (no la URL)
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
        console.warn('Upload pending falló:', e?.message || e);
      }

      // 3) Guardar el formulario para completarlo al primer login
      const payload = {
        rol: this.rol,
        nombre: this.nombre,
        apellido: this.apellido,
        edad: this.edad,
        dni: this.dni,
        obra_social: this.rol === 'paciente' ? this.obra_social : null,
        specialtyId: this.specialtyId,         // "-1" si eligió "Otra"
        specialtyOther: this.specialtyOther || '',
        avatarPath1,
        avatarPath2: this.rol === 'paciente' ? avatarPath2 : null,
      };
      localStorage.setItem('pendingProfile', JSON.stringify(payload));

      alert('Te enviamos un correo para confirmar la cuenta. Luego iniciá sesión para completar el perfil.');
      this.router.navigateByUrl('/login');
    }, 'register');
  }
}
