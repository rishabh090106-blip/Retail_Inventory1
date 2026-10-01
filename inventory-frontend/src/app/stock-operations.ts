import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, InventoryItem, NoticeService, Product, Warehouse } from './api';

type Operation = 'add' | 'reduce' | 'transfer';

@Component({
  selector: 'app-stock-operations',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-heading"><div><p class="eyebrow">INVENTORY CONTROL</p><h1>Stock operations</h1><p class="page-subtitle">Move stock with a clear audit trail across warehouse locations.</p></div></section>
    <section class="operation-layout">
      <div class="operation-main surface-panel">
        <div class="operation-tabs" role="tablist" aria-label="Choose stock operation">
          <button type="button" role="tab" [attr.aria-selected]="active() === 'add'" [class.selected]="active() === 'add'" (click)="active.set('add')"><span>＋</span>Add stock</button>
          <button type="button" role="tab" [attr.aria-selected]="active() === 'reduce'" [class.selected]="active() === 'reduce'" (click)="active.set('reduce')"><span>−</span>Reduce stock</button>
          <button type="button" role="tab" [attr.aria-selected]="active() === 'transfer'" [class.selected]="active() === 'transfer'" (click)="active.set('transfer')"><span>⇄</span>Transfer</button>
        </div>
        @if (active() === 'add') {
          <form class="operation-form" [formGroup]="stockForm" (ngSubmit)="submitStock('add')" novalidate>
            <div class="operation-heading"><span class="operation-icon add-icon">＋</span><div><h2>Receive stock</h2><p>Increase available quantity at a warehouse.</p></div></div>
            <label class="field"><span>Product <i>*</i></span><select formControlName="productId"><option value="">Choose a product</option>@for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }</select></label>
            <label class="field"><span>Warehouse <i>*</i></span><select formControlName="warehouseId"><option value="">Choose a warehouse</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }} · {{ warehouse.location }}</option> }</select></label>
            <label class="field"><span>Quantity to add <i>*</i></span><input type="number" min="1" step="1" formControlName="quantity" placeholder="Enter units" /></label>
            <div class="form-actions"><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Processing…' : 'Add stock' }}</button></div>
          </form>
        } @else if (active() === 'reduce') {
          <form class="operation-form" [formGroup]="stockForm" (ngSubmit)="submitStock('reduce')" novalidate>
            <div class="operation-heading"><span class="operation-icon reduce-icon">−</span><div><h2>Remove stock</h2><p>Adjust inventory down at a selected location.</p></div></div>
            <label class="field"><span>Product <i>*</i></span><select formControlName="productId"><option value="">Choose a product</option>@for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }</select></label>
            <label class="field"><span>Warehouse <i>*</i></span><select formControlName="warehouseId"><option value="">Choose a warehouse</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }} · {{ warehouse.location }}</option> }</select></label>
            <label class="field"><span>Quantity to reduce <i>*</i></span><input type="number" min="1" step="1" formControlName="quantity" placeholder="Enter units" /></label>
            <div class="form-actions"><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Processing…' : 'Reduce stock' }}</button></div>
          </form>
        } @else {
          <form class="operation-form" [formGroup]="transferForm" (ngSubmit)="transfer()" novalidate>
            <div class="operation-heading"><span class="operation-icon transfer-icon">⇄</span><div><h2>Transfer inventory</h2><p>Move units from one warehouse to another.</p></div></div>
            <label class="field"><span>Product <i>*</i></span><select formControlName="productId"><option value="">Choose a product</option>@for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }</select></label>
            <div class="form-two"><label class="field"><span>From warehouse <i>*</i></span><select formControlName="sourceWarehouseId"><option value="">Choose source</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }}</option> }</select></label>
              <label class="field"><span>To warehouse <i>*</i></span><select formControlName="destinationWarehouseId"><option value="">Choose destination</option>@for (warehouse of warehouses(); track warehouse.id) { <option [value]="warehouse.id">{{ warehouse.name }}</option> }</select></label></div>
            <label class="field"><span>Quantity to transfer <i>*</i></span><input type="number" min="1" step="1" formControlName="quantity" placeholder="Enter units" /></label>
            <div class="form-actions"><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Processing…' : 'Transfer stock' }}</button></div>
          </form>
        }
      </div>
      <aside class="operation-aside"><section class="surface-panel note-panel"><span class="note-icon">i</span><p class="eyebrow">STOCK CONTROL</p><h2>Every movement matters.</h2><p>Reductions and transfers are checked against available units. If stock is short, the API will reject the operation without changing either location.</p></section>
        <section class="surface-panel note-panel"><p class="eyebrow">LOCATION COUNT</p><strong class="aside-number">{{ warehouses().length }}</strong><p>warehouses available for stock movements</p></section></aside>
    </section>
  `,
})
export class StockOperations implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notice = inject(NoticeService);
  readonly products = signal<Product[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly active = signal<Operation>('add');
  readonly saving = signal(false);
  readonly stockForm = this.fb.group({ productId: ['', Validators.required], warehouseId: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(1)]] });
  readonly transferForm = this.fb.group({ productId: ['', Validators.required], sourceWarehouseId: ['', Validators.required], destinationWarehouseId: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(1)]] });

  ngOnInit(): void {
    this.api.get<Product[]>('/products').subscribe({ next: (data) => this.products.set(data), error: () => undefined });
    this.api.get<Warehouse[]>('/warehouses').subscribe({ next: (data) => this.warehouses.set(data), error: () => undefined });
  }

  submitStock(operation: 'add' | 'reduce'): void {
    this.stockForm.markAllAsTouched();
    if (this.stockForm.invalid || this.saving()) return;
    const value = this.stockForm.getRawValue();
    const payload = { productId: Number(value.productId), warehouseId: Number(value.warehouseId), quantity: Number(value.quantity) };
    this.saving.set(true);
    const request = this.api.post<InventoryItem>(`/inventory/${operation}`, payload);
    request.subscribe({
      next: () => { this.stockForm.reset({ productId: '', warehouseId: '', quantity: 1 }); this.notice.show(operation === 'add' ? 'Stock added.' : 'Stock reduced.'); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }

  transfer(): void {
    this.transferForm.markAllAsTouched();
    const value = this.transferForm.getRawValue();
    if (this.transferForm.invalid || this.saving()) return;
    if (value.sourceWarehouseId === value.destinationWarehouseId) {
      this.notice.show('Choose two different warehouses for a transfer.', true);
      return;
    }
    this.saving.set(true);
    this.api.post<InventoryItem>('/inventory/transfer', {
      productId: Number(value.productId), sourceWarehouseId: Number(value.sourceWarehouseId),
      destinationWarehouseId: Number(value.destinationWarehouseId), quantity: Number(value.quantity),
    }).subscribe({
      next: () => { this.transferForm.reset({ productId: '', sourceWarehouseId: '', destinationWarehouseId: '', quantity: 1 }); this.notice.show('Stock transferred.'); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
}