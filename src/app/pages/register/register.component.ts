import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LoaderService } from '../../core/services/loader.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AuthService } from '../../core/services/auth.service';
import { SpecialtyService } from '../../core/services/specialty.service';
import { ToastService } from '../../core/services/toast.service';
import { RecaptchaComponent } from '../../shared/recaptcha/recaptcha.component';
import { environment } from '../../../environments/environment';
import { CaptchaDirective } from '../../shared/directives/captcha.directive';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type Rol = 'paciente' | 'especialista';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RecaptchaComponent, CaptchaDirective,TranslatePipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  specialties = signal<{ id: string; nombre: string; isCustom?: boolean }[]>(
    []
  );
  selectedSpecialtyIds: string[] = [];
  specialtyDropdownOpen = false;
  specialtyOtherInput = '';

  captchaToken: string | null = null;
  captchaEnabled = environment.captchaEnabled;

  siteKey = environment.recaptchaSiteKey;

  private loader = inject(LoaderService);
  private router = inject(Router);
  private sb = inject(SupabaseClientService).client;
  private auth = inject(AuthService);
  private specialtySvc = inject(SpecialtyService);
  private toast = inject(ToastService);
  rol: Rol | null = null;

  patientImgUrl = this.sb.storage
    .from('avatars')
    .getPublicUrl('system/user.jpg').data.publicUrl;
  specialistImgUrl = this.sb.storage
    .from('avatars')
    .getPublicUrl('system/especialidad.jpg').data.publicUrl;

  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obra_social = '';
  email = '';
  password = '';

  loading: any;

  foto1?: File;
  foto2?: File;
  fotoEsp?: File;

  ngOnInit() {
    this.cargarEspecialidades();
  }

  // --------- Rol ---------
  chooseRole(role: Rol) {
    this.rol = role;
  }

  // --------- Captcha ---------
  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  // --------- Carga de especialidades desde Supabase ---------
  async cargarEspecialidades() {
    try {
      const { data, error } = await this.specialtySvc.listActive();
      if (!error) {
        this.specialties.set(
          (data ?? []).map((d: any) => ({
            id: d.id as string,
            nombre: d.nombre as string,
          }))
        );
      }
    } catch {}
  }

  // --------- File inputs ---------
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

  // --------- Multi-select con checkboxes ---------
  toggleSpecialtyDropdown() {
    this.specialtyDropdownOpen = !this.specialtyDropdownOpen;
  }

  isSpecialtySelected(id: string): boolean {
    return this.selectedSpecialtyIds.includes(id);
  }

  toggleSpecialty(id: string, checked: boolean) {
    if (checked) {
      if (!this.selectedSpecialtyIds.includes(id)) {
        this.selectedSpecialtyIds.push(id);
      }
    } else {
      this.selectedSpecialtyIds = this.selectedSpecialtyIds.filter(
        (v) => v !== id
      );
    }
  }

  selectedSpecialtiesLabels(): string[] {
    const map = new Map(this.specialties().map((s) => [s.id, s.nombre]));
    return this.selectedSpecialtyIds
      .map((id) => map.get(id))
      .filter((v): v is string => !!v);
  }

  addSpecialty() {
    const name = this.specialtyOtherInput.trim();
    if (!name) {
      this.toast.error('Escribí el nombre de la nueva especialidad.');
      return;
    }

    // ¿Ya existe una especialidad con ese nombre? -> la usamos
    const current = this.specialties();
    const existing = current.find(
      (s) => s.nombre.toLowerCase() === name.toLowerCase()
    );

    let id: string;
    if (existing) {
      id = existing.id;
    } else {
      // Creamos una especialidad "custom" solo en memoria
      id = `custom:${Date.now()}`;
      this.specialties.set([...current, { id, nombre: name, isCustom: true }]);
    }

    if (!this.selectedSpecialtyIds.includes(id)) {
      this.selectedSpecialtyIds.push(id);
    }

    // Limpiamos el input
    this.specialtyOtherInput = '';
    this.toast.success('Especialidad agregada a tu selección.');
  }

  // Cerrar el dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const inside = target.closest('.specialty-multiselect');
    if (!inside) {
      this.specialtyDropdownOpen = false;
    }
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
      if (this.selectedSpecialtyIds.length === 0) {
        return 'Elegí al menos una especialidad';
      }
      if (!this.fotoEsp) return 'Especialistas: subí una imagen de perfil';
    }
    return null;
  }

  async submit() {
    if (!this.rol) {
      this.toast.error('Elegí un perfil.');
      return;
    }

    const msg = this.validar();
    if (msg) {
      this.toast.error(msg);
      return;
    }

    // ---- Validación de captcha (se puede deshabilitar por environment) ----
    if (this.captchaEnabled) {
      if (!this.captchaToken) {
        this.toast.error('Completá el captcha.');
        return;
      }

      const { data: verify, error: vErr } = await this.sb.functions.invoke(
        'verify-recaptcha',
        {
          body: { token: this.captchaToken },
        }
      );

      if (vErr || !verify?.success) {
        this.toast.error('Captcha inválido. Intentá nuevamente.');
        return;
      }
    }

    // ---- Especialidades seleccionadas / otras ----
    let selectedExistingIds: string[] = [];
    let specialtyOther: string | null = null;

    if (this.rol === 'especialista') {
      selectedExistingIds = this.selectedSpecialtyIds.filter(
        (id) => !id.startsWith('custom:')
      );

      const customNames = this.specialties()
        .filter((s) => s.isCustom && this.selectedSpecialtyIds.includes(s.id))
        .map((s) => s.nombre);

      specialtyOther = customNames.length > 0 ? customNames.join(', ') : null;
    }

    // ---- Resto de la lógica igual que tenías ----
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

      const mainSpecialtyId =
        this.rol === 'especialista' ? selectedExistingIds[0] ?? null : null;

      const { error: ppErr } = await this.sb.rpc('upsert_pending_profile', {
        _email: this.email.trim().toLowerCase(),
        _rol: this.rol,
        _nombre: this.nombre.trim(),
        _apellido: this.apellido.trim(),
        _edad: this.edad!,
        _dni: this.dni.trim(),
        _obra_social: this.rol === 'paciente' ? this.obra_social.trim() : null,
        _specialty_id: mainSpecialtyId,
        _specialty_other: specialtyOther,
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
            specialties_ids:
              this.rol === 'especialista' ? selectedExistingIds : null,
            specialty_other: specialtyOther,
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
