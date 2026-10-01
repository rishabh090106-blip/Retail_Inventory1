import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="onBackdrop($event)">
        <section class="modal-panel" role="dialog" aria-modal="true" [attr.aria-label]="title">
          <header class="modal-header"><div><p class="eyebrow">RETAILOPS</p><h2>{{ title }}</h2></div>
            <button class="icon-button" type="button" aria-label="Close dialog" (click)="closed.emit()">×</button>
          </header>
          <div class="modal-content"><ng-content /></div>
        </section>
      </div>
    }
  `,
})
export class Modal {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}