import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OrderStatus } from '../api';

@Component({
  selector: 'app-status-badge',
  imports: [NgClass],
  template: `<span class="status-badge" [ngClass]="status.toLowerCase()">{{ status }}</span>`,
})
export class StatusBadge {
  @Input({ required: true }) status: OrderStatus = 'PENDING';
}