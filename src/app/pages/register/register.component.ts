import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, Role } from '../../core/services/profile.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { SpecialtyService } from '../../core/services/specialty.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  role: Role = 'paciente';
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obra_social = '';
  email = '';
  password = '';
  especialidadNueva = '';
  selectedSpecialtyId: string | null = null;
  img1?: File;
  img2?: File;
  avatar?: File;
  loading = false;

  private auth = inject(AuthService);
  private profileSrv = inject(ProfileService);
  private sb = inject(SupabaseClientService).client;
  specialties = signal<{ id: string; nombre: string }[]>([]);

  async ngOnInit() {
    const { data } = await inject(SpecialtyService).listActive();
    this.specialties.set(
      (data ?? []).map((d: any) => ({ id: d.id, nombre: d.nombre }))
    );
  }

  onFileChange(e: Event, which: 'img1' | 'img2' | 'avatar') {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this[which] = f;
  }

  async addSpecialty() {
    if (!this.especialidadNueva.trim()) return;
    const { data, error } = await inject(SpecialtyService).add(
      this.especialidadNueva.trim()
    );
    if (error) {
      alert(error.message);
      return;
    }
    this.specialties.set([
      ...(this.specialties() ?? []),
      { id: data.id, nombre: data.nombre },
    ]);
    this.selectedSpecialtyId = data.id;
    this.especialidadNueva = '';
  }

  async submit() {
    // Validaciones básicas
    if (
      !this.nombre ||
      !this.apellido ||
      !this.dni ||
      !this.email ||
      !this.password
    ) {
      return alert('Complete los campos obligatorios');
    }
    if (this.role === 'paciente' && (!this.img1 || !this.img2)) {
      return alert('Paciente: suba 2 imágenes');
    }
    if (this.role === 'especialista' && !this.avatar) {
      return alert('Especialista: suba imagen de perfil');
    }

    this.loading = true;

    // 1) Crear auth user
    const { data: sign, error: authErr } = await this.auth.signUpEmail(
      this.email,
      this.password
    );
    if (authErr || !sign.user) {
      this.loading = false;
      return alert(authErr?.message ?? 'Error de registro');
    }

    const userId = sign.user.id;

    // 2) Subir imágenes a Storage
    let avatar_url: string | undefined;
    let extra_img_url: string | undefined;

    if (this.role === 'paciente') {
      const n1 = `${userId}/${uuidv4()}-${this.img1!.name}`;
      const n2 = `${userId}/${uuidv4()}-${this.img2!.name}`;
      await this.sb.storage
        .from('patient-gallery')
        .upload(n1, this.img1!, { upsert: true });
      await this.sb.storage
        .from('patient-gallery')
        .upload(n2, this.img2!, { upsert: true });
      extra_img_url = n2;
      // usar la primera como avatar por defecto
      avatar_url = n1;
    } else if (this.role === 'especialista') {
      const n = `${userId}/${uuidv4()}-${this.avatar!.name}`;
      await this.sb.storage
        .from('avatars')
        .upload(n, this.avatar!, { upsert: true });
      avatar_url = n;
    }

    // 3) Upsert de profile con datos completos
    const base: any = {
      id: userId,
      role: this.role,
      nombre: this.nombre,
      apellido: this.apellido,
      edad: this.edad ?? 0,
      dni: this.dni,
      obra_social: this.role === 'paciente' ? this.obra_social : null,
      email: this.email,
      avatar_url,
      extra_img_url,
    };
    const { error: upErr } = await this.profileSrv.upsertProfile(base);
    if (upErr) {
      this.loading = false;
      return alert(upErr.message);
    }

    // 4) Vincular especialidad (si corresponde)
    if (this.role === 'especialista' && this.selectedSpecialtyId) {
      await this.sb
        .from('profile_specialty')
        .insert({ profile_id: userId, specialty_id: this.selectedSpecialtyId });
    }

    this.loading = false;
    alert('Registro realizado. Revise su email para confirmar la cuenta.');
  }
}
