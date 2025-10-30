import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterOutlet,
  Router,
  NavigationEnd,
  NavigationStart,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
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
  loader = inject(LoaderService);

  isLogged = this.session.isLoggedIn;
  profile = this.session.profile;
  ready = this.session.ready;

  constructor() {
    this.loader.bindToRouter(this.router);

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) console.log('[nav] start', ev.url);
      if (ev instanceof NavigationEnd)
        console.log('[nav] end', ev.urlAfterRedirects);
      if (ev instanceof NavigationCancel) console.log('[nav] cancel', ev.url);
      if (ev instanceof NavigationError)
        console.log('[nav] error', ev.url, ev.error);
    });
  }

  async logout() {
    await this.session.logout();
    this.router.navigateByUrl('/login');
  }
}
