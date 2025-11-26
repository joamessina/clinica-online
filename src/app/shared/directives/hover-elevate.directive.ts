import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appHoverElevate]',
  standalone: true,
})
export class HoverElevateDirective {
  @Input() appHoverElevate: number | string = 2;

  private baseShadow = '0 1px 3px rgba(15,23,42,.18)';
  private hoverShadow = '0 14px 30px rgba(15,23,42,.28)';
  private baseScale = 1;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(
      this.el.nativeElement,
      'transition',
      'transform 120ms ease-out, box-shadow 140ms ease-out'
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      this.baseShadow
    );
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.setHover(true);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.setHover(false);
  }

  private setHover(on: boolean) {
    const level = Number(this.appHoverElevate) || 2;

    const scale = on ? this.baseScale + 0.01 * level : this.baseScale;
    const shadow = on ? this.hoverShadow : this.baseShadow;

    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `translateY(${on ? '-1px' : '0'}) scale(${scale})`
    );
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', shadow);
  }
}
