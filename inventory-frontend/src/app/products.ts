import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, NoticeService, Product, Supplier } from './api';
import { ConfirmDialog } from './shared/confirm-dialog';
import { Modal } from './shared/modal';

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, ReactiveFormsModule, Modal, ConfirmDialog],
  template: `
    <section class="page-heading"><div><p class="eyebrow">CATALOG</p><h1>Products</h1><p class="page-subtitle">Manage your assortment, pricing and reorder points.</p></div><button class="button button-dark" type="button" (click)="startCreate()"><span class="button-plus">+</span> Add product</button></section>
    <section class="surface-panel page-panel">
      <div class="toolbar"><div class="toolbar-title"><strong>Product catalog</strong><span class="count-chip">{{ filtered().length }} items</span></div><div class="toolbar-filters"><label class="search-field"><span>⌕</span><input type="search" placeholder="Search name or SKU" (input)="search.set($any($event.target).value)" /></label><select class="control-select" aria-label="Filter by category" (change)="category.set($any($event.target).value)"><option value="">All categories</option>@for (item of categories(); track item) { <option [value]="item">{{ item }}</option> }</select></div></div>
      @if (loading()) { <div class="loading-state"><span class="spinner"></span>Loading products…</div> }
      @else if (filtered().length) {
        <div class="table-scroll"><table class="data-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>REORDER LEVEL</th><th>SUPPLIER</th><th></th></tr></thead><tbody>
          @for (product of filtered(); track product.id) {
            <tr><td><div class="primary-cell">{{ product.name }}<small>{{ product.description || 'No description' }}</small></div></td><td><span class="mono">{{ product.sku }}</span></td><td><span class="soft-tag">{{ product.category }}</span></td><td class="numeric">{{ product.price | currency }}</td><td>{{ product.reorderLevel }} units</td><td>{{ product.supplier?.name || '—' }}</td><td><div class="row-actions"><button class="icon-button" type="button" title="Edit product" aria-label="Edit {{ product.name }}" (click)="startEdit(product)">✎</button><button class="icon-button danger-icon" type="button" title="Delete product" aria-label="Delete {{ product.name }}" (click)="deleting.set(product)">×</button></div></td></tr>
          }
        </tbody></table></div>
      } @else { <div class="empty-state"><span class="empty-mark">▦</span><strong>{{ products().length ? 'No matching products' : 'Your catalog is empty' }}</strong><p>{{ products().length ? 'Try another search or category.' : 'Add your first item to start managing the catalog.' }}</p></div> }
    </section>
    <app-modal [open]="modalOpen()" [title]="editing() ? 'Edit product' : 'Add product'" (closed)="closeModal()">
      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <label class="field"><span>Product name <i>*</i></span><input formControlName="name" placeholder="e.g. Ground coffee" /><small class="field-error">{{ error('name') }}</small></label>
        <label class="field"><span>SKU <i>*</i></span><input formControlName="sku" placeholder="e.g. COF-001" /></label>
        <label class="field"><span>Category <i>*</i></span><input formControlName="category" placeholder="e.g. Grocery" /></label>
        <label class="field"><span>Supplier <i>*</i></span><select formControlName="supplierId"><option value="">Choose supplier</option>@for (supplier of suppliers(); track supplier.id) { <option [value]="supplier.id">{{ supplier.name }}</option> }</select></label>
        <label class="field"><span>Price <i>*</i></span><input type="number" min="0" step="0.01" formControlName="price" /></label>
        <label class="field"><span>Reorder level <i>*</i></span><input type="number" min="0" step="1" formControlName="reorderLevel" /></label>
        <label class="field field-wide"><span>Description</span><textarea rows="3" formControlName="description" placeholder="A short product description"></textarea></label>
        <div class="form-actions field-wide"><button class="button button-quiet" type="button" [disabled]="saving()" (click)="closeModal()">Cancel</button><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Create product' }}</button></div>
      </form>
    </app-modal>
    <app-confirm-dialog [open]="!!deleting()" [busy]="saving()" title="Delete product?" [message]="'Remove ' + (deleting()?.name || 'this product') + ' from the catalog?'" confirmText="Delete product" (cancelled)="deleting.set(null)" (confirmed)="remove()" />
  `,
})
export class Products implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notice = inject(NoticeService);
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly deleting = signal<Product | null>(null);
  readonly search = signal('');
  readonly category = signal('');
  readonly categories = computed(() => [...new Set(this.products().map((product) => product.category))].sort());
  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.products().filter((product) => (!this.category() || product.category === this.category())
      && (!term || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(term)));
  });
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    sku: ['', [Validators.required, Validators.maxLength(64)]],
    description: [''],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [0, [Validators.required, Validators.min(0)]],
    supplierId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.api.get<Supplier[]>('/suppliers').subscribe({ next: (data) => this.suppliers.set(data), error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<Product[]>('/products').subscribe({ next: (data) => this.products.set(data), error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', sku: '', description: '', category: '', price: 0, reorderLevel: 0, supplierId: '' });
    this.modalOpen.set(true);
  }

  startEdit(product: Product): void {
    this.editing.set(product);
    this.form.reset({ ...product, supplierId: String(product.supplier?.id ?? '') });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (!this.saving()) this.modalOpen.set(false);
  }

  error(field: string): string {
    const control = this.form.get(field);
    return control?.touched && control.hasError('required') ? 'This field is required.' : '';
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    const payload = { ...value, price: Number(value.price), reorderLevel: Number(value.reorderLevel), supplier: { id: Number(value.supplierId) } };
    this.saving.set(true);
    const product = this.editing();
    const request = product ? this.api.put<Product>(`/products/${product.id}`, payload) : this.api.post<Product>('/products', payload);
    request.subscribe({
      next: () => { this.modalOpen.set(false); this.notice.show(product ? 'Product updated.' : 'Product added.'); this.load(); },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  remove(): void {
    const product = this.deleting();
    if (!product || this.saving()) return;
    this.saving.set(true);
    this.api.delete(`/products/${product.id}`).subscribe({
      next: () => { this.deleting.set(null); this.notice.show('Product deleted.'); this.load(); },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }
}
