import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { LoaderComponent } from './shared/loader/loader.component';
import { SessionService } from './core/services/session.service';
import { LoaderService } from './core/services/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private session = inject(SessionService);
  private router = inject(Router);
  /** inyectamos el servicio de loader para el overlay global */
  loader = inject(LoaderService);

  isLogged = this.session.isLoggedIn;
  profile  = this.session.profile;

  async logout() {
    await this.session.logout();
    this.router.navigateByUrl('/login');
  }
}
