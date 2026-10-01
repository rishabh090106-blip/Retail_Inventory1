import { Component, inject } from '@angular/core';
import { NoticeService } from '../api';

@Component({
  selector: 'app-toast',
  template: `
    @if (notice.current(); as toast) {
      <div class="toast" [class.toast-error]="toast.error" [attr.role]="toast.error ? 'alert' : 'status'">
        <span class="toast-indicator">{{ toast.error ? '!' : '✓' }}</span>
        <span>{{ toast.message }}</span>
        <button type="button" aria-label="Dismiss notification" (click)="notice.clear()">×</button>
      </div>
    }
  `,
})
export class Toast {
  readonly notice = inject(NoticeService);
}