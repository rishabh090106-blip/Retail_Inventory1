import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="onBackdrop($event)">
        <section class="confirm-panel" role="alertdialog" aria-modal="true" [attr.aria-label]="title">
          <span class="confirm-mark">!</span>
          <h2>{{ title }}</h2><p>{{ message }}</p>
          <div class="dialog-actions">
            <button class="button button-quiet" type="button" [disabled]="busy" (click)="cancelled.emit()">Keep it</button>
            <button class="button button-danger" type="button" [disabled]="busy" (click)="confirmed.emit()">
              {{ busy ? 'Working…' : confirmText }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() busy = false;
  @Input() title = 'Confirm action';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy) this.cancelled.emit();
  }
}