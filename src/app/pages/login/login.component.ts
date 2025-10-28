// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { LoaderService } from '../../core/services/loader.service';

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

      const prof = this.session.profile();
      console.log('[login] profile ->', prof);

      // defensa: si aún no hay perfil, mandalo a /paciente y vemos
      if (!prof) {
        this.router.navigateByUrl('/paciente');
        return;
      }

      if (prof.role === 'especialista' && !prof.is_approved) {
        alert('Pendiente de aprobación.');
        return;
      }

      if (prof.role === 'admin') this.router.navigateByUrl('/admin/usuarios');
      else if (prof.role === 'especialista') this.router.navigateByUrl('/especialista');
      else this.router.navigateByUrl('/paciente');
    });
  }
}
