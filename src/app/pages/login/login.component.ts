import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.services';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  private auth = inject(AuthService);
  private router = inject(Router);
  private profileSrv = inject(ProfileService);

  async submit() {
    this.loading = true;
    const { error } = await this.auth.signInEmail(this.email, this.password);
    this.loading = false;
    if (error) return alert(error.message);

    // redirige según role
    const me = await this.profileSrv.getMyProfile();
    if (!me) return;
    if (!me.email) return alert('Debe verificar el email');
    if (me.role === 'admin') this.router.navigateByUrl('/admin/usuarios');
    else if (me.role === 'especialista')
      this.router.navigateByUrl('/especialista');
    else this.router.navigateByUrl('/paciente');
  }

  // Accesos rápidos demo (opcional)
  async quick(role: 'admin' | 'especialista' | 'paciente') {
    const map = {
      admin: { email: 'admin@demo.com', password: 'Admin123!' },
      especialista: { email: 'esp@demo.com', password: 'Esp123!' },
      paciente: { email: 'pac@demo.com', password: 'Pac123!' },
    } as const;
    this.email = map[role].email;
    this.password = map[role].password;
  }
}
