import { Component, inject, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-back-button',
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="btn"
      [class]="'btn-' + variant + ' btn-' + size"
      (click)="back()"
    >
      <i class="bi bi-arrow-left-short me-1"></i> Volver
    </button>
  `,
})
export class BackButtonComponent {
  private location = inject(Location);
  @Input() variant: 'link' | 'light' | 'secondary' | 'outline-secondary' =
    'light';
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  back() {
    this.location.back();
  }
}
