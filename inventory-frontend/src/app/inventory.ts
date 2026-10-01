import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, InventoryItem, Warehouse } from './api';

@Component({
  selector: 'app-inventory',
  imports: [DatePipe, RouterLink],
  template: `
    <section class="page-heading"><div><p class="eyebrow">STOCK POSITION</p><h1>Inventory</h1><p class="page-subtitle">See available units by location and flag replenishment needs.</p></div><a class="button button-dark" routerLink="/stock-operations"><span class="button-plus">+</span> Stock operation</a></section>
    <section class="surface-panel page-panel">
      <div class="inventory-toolbar"><div class="view-tabs" role="tablist" aria-label="Inventory view"><button type="button" role="tab" [class.selected]="view() === 'warehouse'" [attr.aria-selected]="view() === 'warehouse'" (click)="setView('warehouse')">By warehouse</button><button type="button" role="tab" [class.selected]="view() === 'low'" [attr.aria-selected]="view() === 'low'" (click)="setView('low')">Low-stock report <span class="tab-count">{{ lowCount() }}</span></button></div>
        @if (view() === 'warehouse') { <label class="warehouse-select"><span>LOCATION</span><select [value]="warehouseId()" (change)="pickWarehouse($any($event.target).value)"><option value="">Choose a warehouse</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }} · {{ warehouse.location }}</option> }</select></label> }
      </div>
      @if (loading()) { <div class="loading-state"><span class="spinner"></span>Loading stock levels…</div> }
      @else if (rows().length) { <div class="table-scroll"><table class="data-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>WAREHOUSE</th><th>AVAILABLE</th><th>REORDER AT</th><th>LAST UPDATED</th></tr></thead><tbody>
        @for (item of rows(); track item.id) { <tr [class.low-stock-row]="isLow(item)"><td><div class="primary-cell">{{ item.product.name }}<small>{{ item.product.category }}</small></div></td><td><span class="mono">{{ item.product.sku }}</span></td><td>{{ item.warehouse.name }}</td><td><span class="stock-quantity" [class.is-low]="isLow(item)">{{ item.quantity }}<small>units</small></span></td><td>{{ item.product.reorderLevel }} units</td><td>{{ item.lastUpdated | date:'MMM d, y · h:mm a' }}</td></tr> }
      </tbody></table></div> }
      @else { <div class="empty-state"><span class="empty-mark">▤</span><strong>{{ view() === 'low' ? 'No low-stock items' : warehouseId() ? 'This warehouse is empty' : 'Choose a warehouse' }}</strong><p>{{ view() === 'low' ? 'Every tracked product is at or above its reorder level.' : 'Select a location to inspect its current stock.' }}</p></div> }
    </section>
    <div class="inventory-footnote"><span class="alert-dot"></span>Low stock is defined as quantity below the product’s reorder level.</div>
  `,
})
export class InventoryPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly rows = signal<InventoryItem[]>([]);
  readonly lowCount = signal(0);
  readonly warehouseId = signal('');
  readonly view = signal<'warehouse' | 'low'>('warehouse');
  readonly loading = signal(false);

  ngOnInit(): void {
    this.api.get<Warehouse[]>('/warehouses').subscribe({
      next: (warehouses) => {
        this.warehouses.set(warehouses);
        if (warehouses.length) { this.warehouseId.set(String(warehouses[0].id)); this.loadWarehouse(); }
      },
      error: () => undefined,
    });
    this.api.get<InventoryItem[]>('/inventory/low-stock').subscribe({ next: (items) => this.lowCount.set(items.length), error: () => undefined });
  }

  isLow(item: InventoryItem): boolean { return item.quantity < item.product.reorderLevel; }
  pickWarehouse(id: string): void { this.warehouseId.set(id); this.view.set('warehouse'); this.loadWarehouse(); }
  setView(view: 'warehouse' | 'low'): void { this.view.set(view); view === 'low' ? this.loadLowStock() : this.loadWarehouse(); }
  private loadWarehouse(): void {
    if (!this.warehouseId()) { this.rows.set([]); return; }
    this.loading.set(true);
    this.api.get<InventoryItem[]>(`/inventory/warehouse/${this.warehouseId()}`).subscribe({ next: (items) => this.rows.set(items), error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }
  private loadLowStock(): void {
    this.loading.set(true);
    this.api.get<InventoryItem[]>('/inventory/low-stock').subscribe({ next: (items) => { this.rows.set(items); this.lowCount.set(items.length); }, error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }
}
