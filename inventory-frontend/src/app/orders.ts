import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, CustomerOrder, NoticeService, OrderStatus, Product, Warehouse } from './api';
import { ConfirmDialog } from './shared/confirm-dialog';
import { Modal } from './shared/modal';
import { StatusBadge } from './shared/status-badge';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, ReactiveFormsModule, Modal, ConfirmDialog, StatusBadge],
  template: `
    <section class="page-heading"><div><p class="eyebrow">FULFILLMENT</p><h1>Orders</h1><p class="page-subtitle">Track customer demand from confirmation through delivery.</p></div><button class="button button-dark" type="button" (click)="openCreate()"><span class="button-plus">+</span> Place order</button></section>
    <section class="surface-panel page-panel"><div class="toolbar"><div class="toolbar-title"><strong>Order queue</strong><span class="count-chip">{{ rows().length }} orders</span></div><label class="warehouse-select status-filter"><span>STATUS</span><select [value]="statusFilter()" (change)="filterBy($any($event.target).value)"><option value="">All statuses</option>@for (status of statuses; track status) { <option [value]="status">{{ status }}</option> }</select></label></div>
      @if (loading()) { <div class="loading-state"><span class="spinner"></span>Loading orders…</div> }
      @else if (rows().length) { <div class="table-scroll"><table class="data-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PRODUCT</th><th>WAREHOUSE</th><th>QTY</th><th>STATUS</th><th>CHANGE STATUS</th><th></th></tr></thead><tbody>
        @for (order of rows(); track order.id) { <tr><td><button class="table-link mono" type="button" (click)="showDetails(order)">{{ order.orderNumber }}</button><small class="date-subline">{{ order.orderDate | date:'MMM d, y' }}</small></td><td>{{ order.customerName }}</td><td>{{ order.product.name }}</td><td>{{ order.warehouse.name }}</td><td>{{ order.quantity }}</td><td><app-status-badge [status]="order.status" /></td>
          <td>@if (order.status === 'CANCELLED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') { <span class="muted-cell">—</span> } @else { <select class="status-select" [value]="order.status" [disabled]="busyOrder() === order.id" (change)="changeStatus(order, $any($event.target).value)"><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option></select> }</td>
          <td>@if (order.status !== 'CANCELLED' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED') { <button class="text-action danger-text" type="button" [disabled]="busyOrder() === order.id" (click)="cancelTarget.set(order)">Cancel</button> }</td></tr> }
      </tbody></table></div> }
      @else { <div class="empty-state"><span class="empty-mark">≡</span><strong>{{ statusFilter() ? 'No orders in this status' : 'No orders yet' }}</strong><p>{{ statusFilter() ? 'Choose another status or clear the filter.' : 'Place an order to start tracking fulfillment.' }}</p></div> }
    </section>
    <app-modal [open]="createOpen()" title="Place an order" (closed)="closeCreate()"><form class="form-grid" [formGroup]="form" (ngSubmit)="place()" novalidate>
      <label class="field field-wide"><span>Customer name <i>*</i></span><input formControlName="customerName" placeholder="Customer or account name" /></label>
      <label class="field"><span>Product <i>*</i></span><select formControlName="productId"><option value="">Choose product</option>@for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }</select></label>
      <label class="field"><span>Warehouse <i>*</i></span><select formControlName="warehouseId"><option value="">Choose warehouse</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }}</option> }</select></label>
      <label class="field field-wide"><span>Quantity <i>*</i></span><input type="number" min="1" step="1" formControlName="quantity" /></label>
      <p class="form-hint field-wide">Stock is checked and reserved when the order is placed.</p>
      <div class="form-actions field-wide"><button class="button button-quiet" type="button" [disabled]="saving()" (click)="closeCreate()">Cancel</button><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Placing order…' : 'Confirm order' }}</button></div>
    </form></app-modal>
    <app-modal [open]="!!details()" title="Order details" (closed)="details.set(null)">@if (details(); as order) { <div class="detail-list"><div class="detail-top"><strong>{{ order.orderNumber }}</strong><app-status-badge [status]="order.status" /></div><dl><div><dt>Customer</dt><dd>{{ order.customerName }}</dd></div><div><dt>Product</dt><dd>{{ order.product.name }} · {{ order.product.sku }}</dd></div><div><dt>Warehouse</dt><dd>{{ order.warehouse.name }}</dd></div><div><dt>Quantity</dt><dd>{{ order.quantity }} units</dd></div><div><dt>Order date</dt><dd>{{ order.orderDate | date:'MMM d, y · h:mm a' }}</dd></div></dl></div> }</app-modal>
    <app-confirm-dialog [open]="!!cancelTarget()" [busy]="saving()" title="Cancel this order?" [message]="'Cancel ' + (cancelTarget()?.orderNumber || 'this order') + ' and return its units to stock?'" confirmText="Cancel order" (cancelled)="cancelTarget.set(null)" (confirmed)="cancel()" />
  `,
})
export class Orders implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notice = inject(NoticeService);
  readonly statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  readonly rows = signal<CustomerOrder[]>([]);
  readonly products = signal<Product[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly statusFilter = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busyOrder = signal<number | null>(null);
  readonly createOpen = signal(false);
  readonly details = signal<CustomerOrder | null>(null);
  readonly cancelTarget = signal<CustomerOrder | null>(null);
  readonly form = this.fb.group({ customerName: ['', [Validators.required, Validators.maxLength(160)]], productId: ['', Validators.required], warehouseId: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(1)]] });

  ngOnInit(): void {
    this.api.get<Product[]>('/products').subscribe({ next: (data) => this.products.set(data), error: () => undefined });
    this.api.get<Warehouse[]>('/warehouses').subscribe({ next: (data) => this.warehouses.set(data), error: () => undefined });
    this.load();
  }
  load(): void {
    this.loading.set(true);
    const path = this.statusFilter() ? `/orders?status=${this.statusFilter()}` : '/orders';
    this.api.get<CustomerOrder[]>(path).subscribe({ next: (data) => this.rows.set(data), error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }
  filterBy(status: string): void { this.statusFilter.set(status); this.load(); }
  openCreate(): void { this.form.reset({ customerName: '', productId: '', warehouseId: '', quantity: 1 }); this.createOpen.set(true); }
  closeCreate(): void { if (!this.saving()) this.createOpen.set(false); }
  place(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api.post<CustomerOrder>('/orders', { customerName: value.customerName, productId: Number(value.productId), warehouseId: Number(value.warehouseId), quantity: Number(value.quantity) }).subscribe({
      next: () => { this.createOpen.set(false); this.notice.show('Order placed and inventory reserved.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
  changeStatus(order: CustomerOrder, status: OrderStatus): void {
    if (status === order.status) return;
    this.busyOrder.set(order.id);
    this.api.put<CustomerOrder>(`/orders/${order.id}/status`, { status }).subscribe({
      next: () => { this.notice.show('Order status updated.'); this.load(); },
      error: () => this.busyOrder.set(null), complete: () => this.busyOrder.set(null),
    });
  }
  cancel(): void {
    const order = this.cancelTarget();
    if (!order || this.saving()) return;
    this.saving.set(true);
    this.api.post<CustomerOrder>(`/orders/${order.id}/cancel`, {}).subscribe({
      next: () => { this.cancelTarget.set(null); this.notice.show('Order cancelled and stock restored.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
  showDetails(order: CustomerOrder): void {
    this.api.get<CustomerOrder>(`/orders/${order.id}`).subscribe({ next: (data) => this.details.set(data), error: () => undefined });
  }
}
