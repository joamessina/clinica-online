import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appCaptcha]',
  standalone: true,
})
export class CaptchaDirective {
  @Input('appCaptcha') enabled = true;

  @Input() persist = false;

  @Output() captchaPassed = new EventEmitter<void>();

  private alreadyPassed = false;

  @HostListener('click', ['$event'])
  onClick(ev: Event) {
    if (!this.enabled) {
      this.captchaPassed.emit();
      return;
    }

    if (this.persist && this.alreadyPassed) {
      this.captchaPassed.emit();
      return;
    }

    ev.preventDefault();
    ev.stopImmediatePropagation();

    const a = this.randomInt(1, 9);
    const b = this.randomInt(1, 9);
    const expected = a + b;

    const answer = window.prompt(
      `Verificación anti-bot:\n\n¿Cuánto es ${a} + ${b}?`
    );

    if (answer === null) {
      return;
    }

    const num = Number(answer.trim());

    if (!Number.isNaN(num) && num === expected) {
      this.alreadyPassed = true;
      this.captchaPassed.emit();
    } else {
      alert('Respuesta incorrecta. Intentá nuevamente.');
    }
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
