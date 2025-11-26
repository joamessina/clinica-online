import { Directive, ElementRef, Renderer2, Input } from '@angular/core';

@Directive({
  selector: '[appStatusBadge]',
  standalone: true,
})
export class StatusBadgeDirective {
  private readonly statusClasses = ['status-ok', 'status-pending'];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @Input() set appStatusBadge(value: boolean | null | undefined) {
    this.statusClasses.forEach((cls) =>
      this.renderer.removeClass(this.el.nativeElement, cls)
    );

    if (value === true) {
      this.renderer.addClass(this.el.nativeElement, 'status-ok');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'status-pending');
    }
  }
}
