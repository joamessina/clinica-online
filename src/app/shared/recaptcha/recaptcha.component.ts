import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecaptchaLoaderService } from '../../core/services/recaptcha-loader.service';
import { environment } from '../../../environments/environment';

declare const grecaptcha: any;

@Component({
  standalone: true,
  selector: 'app-recaptcha',
  imports: [CommonModule],
  templateUrl: './recaptcha.component.html',
  styleUrls: ['./recaptcha.component.scss'],
})
export class RecaptchaComponent implements OnInit, OnDestroy {
  @Input() siteKey = environment.recaptchaSiteKey;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() size: 'normal' | 'compact' = 'normal';
  @Output() resolved = new EventEmitter<string | null>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private widgetId: number | null = null;

  constructor(private loader: RecaptchaLoaderService) {}

  async ngOnInit() {
    await this.loader.load();
    this.render();
  }

  ngOnDestroy() {
    try {
      if (this.widgetId !== null && typeof grecaptcha?.reset === 'function') {
        grecaptcha.reset(this.widgetId);
      }
    } catch {}
  }

  private render() {
    if (!this.siteKey) {
      console.warn('[reCAPTCHA] faltó siteKey');
      return;
    }

    this.widgetId = grecaptcha.render(this.host.nativeElement, {
      sitekey: this.siteKey,
      theme: this.theme,
      size: this.size,
      callback: (token: string) => this.resolved.emit(token),
      'expired-callback': () => this.resolved.emit(null),
      'error-callback': () => this.resolved.emit(null),
    });
  }

  reset() {
    if (this.widgetId !== null) grecaptcha.reset(this.widgetId);
  }
}
