import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  selector: 'app-welcome',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  private i18n = inject(I18nService);

  t = this.i18n.t;
}
