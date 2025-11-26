import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterOutlet,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { LoaderComponent } from './shared/loader/loader.component';
import { SessionService } from './core/services/session.service';
import { LoaderService } from './core/services/loader.service';
import { ToastsComponent } from './core/services/toast.component';
import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';
import { I18nService, Lang } from './core/i18n/i18n.service';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    LoaderComponent,
    ToastsComponent,
    TranslatePipe,
    FormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
animations: [
    trigger('routeAnimations', [
      transition('* => slideDown', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(-40px)' }),
            animate(
              '300ms ease-out',
              style({ opacity: 1, transform: 'translateY(0)' })
            ),
          ],
          { optional: true }
        ),
      ]),

      transition('* => slideRight', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateX(40px)' }),
            animate(
              '300ms ease-out',
              style({ opacity: 1, transform: 'translateX(0)' })
            ),
          ],
          { optional: true }
        ),
      ]),

      transition('* => slideUp', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(40px)' }),
            animate(
              '300ms ease-out',
              style({ opacity: 1, transform: 'translateY(0)' })
            ),
          ],
          { optional: true }
        ),
      ]),

      transition('* => slideLeft', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateX(-40px)' }),
            animate(
              '300ms ease-out',
              style({ opacity: 1, transform: 'translateX(0)' })
            ),
          ],
          { optional: true }
        ),
      ]),

      transition('* => fade', [
        query(
          ':enter',
          [
            style({ opacity: 0 }),
            animate('250ms ease-out', style({ opacity: 1 })),
          ],
          { optional: true }
        ),
      ]),

      transition('* => zoom', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'scale(0.9)' }),
            animate(
              '250ms ease-out',
              style({ opacity: 1, transform: 'scale(1)' })
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})

export class AppComponent {
  private session = inject(SessionService);
  private router = inject(Router);
  loader = inject(LoaderService);
  i18n = inject(I18nService);

  @ViewChild(RouterOutlet) outlet?: RouterOutlet;

  isLogged = this.session.isLoggedIn;
  profile = this.session.profile;
  ready = this.session.ready;

  prepareRoute() {
    return this.outlet?.activatedRouteData?.['animation'];
  }

  currentLang(): Lang {
    return this.i18n.lang();
  }

changeLang(lang: string) {
    this.i18n.setLang(lang as Lang);
  }

  constructor() {
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        console.log('[nav] start', ev.url);
        this.loader.show?.();
      }
      if (
        ev instanceof NavigationEnd ||
        ev instanceof NavigationCancel ||
        ev instanceof NavigationError
      ) {
        console.log('[nav] end/cancel', (ev as any).url || '');
        this.loader.hide?.();
      }
    });
  }

  async logout() {
    await this.session.logout();
    this.router.navigateByUrl('/login');
  }
}
