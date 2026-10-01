import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, CustomerOrder, InventoryItem, OrderStatus, Product, Warehouse } from './api';
import { StatusBadge } from './shared/status-badge';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, StatusBadge],
  template: `
    <section class="page-heading"><div><p class="eyebrow">OVERVIEW</p><h1>Good morning, operator.</h1><p class="page-subtitle">Here’s the pulse of your retail network today.</p></div><a class="button button-dark" routerLink="/orders">Create an order <span>↗</span></a></section>
    @if (loading()) {
      <div class="loading-state"><span class="spinner"></span>Gathering your inventory data…</div>
    } @else {
      <section class="metric-grid" aria-label="Key metrics">
        <article class="metric-card metric-coral"><div class="metric-top"><span>PRODUCTS</span><span class="metric-glyph">▦</span></div><strong>{{ products().length }}</strong><small>Active catalog items</small></article>
        <article class="metric-card metric-green"><div class="metric-top"><span>WAREHOUSES</span><span class="metric-glyph">▥</span></div><strong>{{ warehouses().length }}</strong><small>Across your network</small></article>
        <article class="metric-card metric-red"><div class="metric-top"><span>LOW STOCK</span><span class="metric-glyph">!</span></div><strong>{{ lowStock().length }}</strong><small>Below reorder threshold</small></article>
        <article class="metric-card metric-ink"><div class="metric-top"><span>OPEN ORDERS</span><span class="metric-glyph">≡</span></div><strong>{{ openOrders() }}</strong><small>Awaiting fulfillment</small></article>
      </section>
      <section class="status-strip"><div class="section-title"><div><p class="eyebrow">FULFILLMENT</p><h2>Orders by status</h2></div><a class="text-link" routerLink="/orders">View all orders <span>→</span></a></div>
        <div class="status-counts">@for (status of statuses; track status) { <div class="status-count"><app-status-badge [status]="status"/><strong>{{ statusCounts()[status] }}</strong></div> }</div>
      </section>
      <div class="dashboard-grid">
        <section class="surface-panel"><div class="section-title"><div><p class="eyebrow">NEEDS ATTENTION</p><h2>Low-stock items</h2></div><a class="text-link" routerLink="/inventory">Inventory <span>→</span></a></div>
          @if (lowStock().length) { <div class="table-scroll"><table class="data-table"><thead><tr><th>Product</th><th>Warehouse</th><th>On hand</th><th>Reorder at</th></tr></thead><tbody>
            @for (item of lowStock().slice(0, 6); track item.id) { <tr><td><div class="primary-cell">{{ item.product.name }}<small>{{ item.product.sku }}</small></div></td><td>{{ item.warehouse.name }}</td><td><span class="stock-quantity is-low">{{ item.quantity }}</span></td><td>{{ item.product.reorderLevel }}</td></tr> }
          </tbody></table></div> } @else { <div class="empty-state"><span class="empty-mark">✓</span><strong>All stocked up</strong><p>No inventory is below its reorder level.</p></div> }
        </section>
        <section class="surface-panel recent-panel"><div class="section-title"><div><p class="eyebrow">LATEST ACTIVITY</p><h2>Recent orders</h2></div><a class="text-link" routerLink="/orders">All orders <span>→</span></a></div>
          @if (recentOrders().length) { <div class="recent-list">@for (order of recentOrders(); track order.id) { <article class="recent-order"><span class="order-symbol">↗</span><div class="recent-copy"><strong>{{ order.orderNumber }}</strong><small>{{ order.customerName }} · {{ order.product.name }}</small></div><app-status-badge [status]="order.status"/><time>{{ order.orderDate | date:'MMM d' }}</time></article> }</div>
          } @else { <div class="empty-state"><strong>No orders yet</strong><p>Placed orders will appear here.</p></div> }
        </section>
      </div>
    }
  `,
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly products = signal<Product[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly lowStock = signal<InventoryItem[]>([]);
  readonly orders = signal<CustomerOrder[]>([]);
  readonly statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  readonly statusCounts = computed(() => Object.fromEntries(
    this.statuses.map((status) => [status, this.orders().filter((order) => order.status === status).length]),
  ) as Record<OrderStatus, number>);
  readonly openOrders = computed(() => this.orders().filter((order) => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)).length);
  readonly recentOrders = computed(() => [...this.orders()].sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 5));

  ngOnInit(): void {
    this.api.get<Product[]>('/products').subscribe({ next: (data) => this.products.set(data), error: () => undefined });
    let pending = 3;
    const finish = (): void => { pending -= 1; if (pending === 0) this.loading.set(false); };
    this.api.get<Warehouse[]>('/warehouses').subscribe({ next: (data) => this.warehouses.set(data), error: finish, complete: finish });
    this.api.get<InventoryItem[]>('/inventory/low-stock').subscribe({ next: (data) => this.lowStock.set(data), error: finish, complete: finish });
    this.api.get<CustomerOrder[]>('/orders').subscribe({ next: (data) => this.orders.set(data), error: finish, complete: finish });
  }
}