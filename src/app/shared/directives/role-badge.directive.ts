import { Directive, ElementRef, Renderer2, Input } from '@angular/core';

@Directive({
  selector: '[appRoleBadge]',
  standalone: true,
})
export class RoleBadgeDirective {
  private readonly roleClasses = [
    'role-admin',
    'role-especialista',
    'role-paciente',
  ];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @Input() set appRoleBadge(role: string | null | undefined) {
    this.roleClasses.forEach((cls) =>
      this.renderer.removeClass(this.el.nativeElement, cls)
    );

    switch (role) {
      case 'admin':
        this.renderer.addClass(this.el.nativeElement, 'role-admin');
        break;
      case 'especialista':
        this.renderer.addClass(this.el.nativeElement, 'role-especialista');
        break;
      case 'paciente':
        this.renderer.addClass(this.el.nativeElement, 'role-paciente');
        break;
      default:
        break;
    }
  }
}
