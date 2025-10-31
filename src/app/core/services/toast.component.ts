import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  standalone: true,
  selector: 'app-toasts',
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div
        *ngFor="let t of svc.toasts()"
        class="toast show align-items-center text-bg-{{
          t.variant
        }} border-0 mb-2 shadow"
      >
        <div class="d-flex">
          <div class="toast-body">{{ t.text }}</div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            (click)="svc.dismiss(t.id)"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  `,
})
export class ToastsComponent {
  constructor(public svc: ToastService) {}
}
