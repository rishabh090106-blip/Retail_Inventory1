import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, NoticeService, Warehouse } from './api';
import { ConfirmDialog } from './shared/confirm-dialog';
import { Modal } from './shared/modal';

@Component({
  selector: 'app-warehouses',
  imports: [DecimalPipe, ReactiveFormsModule, Modal, ConfirmDialog],
  template: `
    <section class="page-heading"><div><p class="eyebrow">NETWORK</p><h1>Warehouses</h1><p class="page-subtitle">Manage locations that hold and fulfill your inventory.</p></div><button class="button button-dark" type="button" (click)="startCreate()"><span class="button-plus">+</span> Add warehouse</button></section>
    <section class="surface-panel page-panel"><div class="toolbar"><div class="toolbar-title"><strong>Warehouse locations</strong><span class="count-chip">{{ warehouses().length }} locations</span></div><label class="search-field"><span>⌕</span><input type="search" placeholder="Search location" (input)="query.set($any($event.target).value)" /></label></div>
      @if (loading()) { <div class="loading-state"><span class="spinner"></span>Loading warehouses…</div> }
      @else if (visible().length) { <div class="table-scroll"><table class="data-table"><thead><tr><th>WAREHOUSE</th><th>LOCATION</th><th>CAPACITY</th><th>STATUS</th><th></th></tr></thead><tbody>
        @for (warehouse of visible(); track warehouse.id) { <tr><td><div class="primary-cell">{{ warehouse.name }}<small>WH-{{ warehouse.id.toString().padStart(4, '0') }}</small></div></td><td>{{ warehouse.location }}</td><td>{{ warehouse.capacity | number }} units</td><td><span class="soft-tag soft-green">Active</span></td><td><div class="row-actions"><button class="icon-button" type="button" title="Edit warehouse" aria-label="Edit {{ warehouse.name }}" (click)="startEdit(warehouse)">✎</button><button class="icon-button danger-icon" type="button" title="Delete warehouse" aria-label="Delete {{ warehouse.name }}" (click)="deleting.set(warehouse)">×</button></div></td></tr> }
      </tbody></table></div> }
      @else { <div class="empty-state"><span class="empty-mark">▥</span><strong>{{ warehouses().length ? 'No matching locations' : 'No warehouses yet' }}</strong><p>{{ warehouses().length ? 'Try another search.' : 'Create a warehouse to start tracking stock by location.' }}</p></div> }
    </section>
    <app-modal [open]="modalOpen()" [title]="editing() ? 'Edit warehouse' : 'Add warehouse'" (closed)="closeModal()"><form class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <label class="field field-wide"><span>Warehouse name <i>*</i></span><input formControlName="name" placeholder="Central warehouse" /></label>
      <label class="field field-wide"><span>Location <i>*</i></span><input formControlName="location" placeholder="City, region" /></label>
      <label class="field field-wide"><span>Capacity in units <i>*</i></span><input type="number" min="1" step="1" formControlName="capacity" /></label>
      <div class="form-actions field-wide"><button class="button button-quiet" type="button" [disabled]="saving()" (click)="closeModal()">Cancel</button><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Create warehouse' }}</button></div>
    </form></app-modal>
    <app-confirm-dialog [open]="!!deleting()" [busy]="saving()" title="Delete warehouse?" [message]="'Remove ' + (deleting()?.name || 'this warehouse') + '? Existing inventory or orders may prevent deletion.'" confirmText="Delete warehouse" (cancelled)="deleting.set(null)" (confirmed)="remove()" />
  `,
})
export class Warehouses implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notice = inject(NoticeService);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Warehouse | null>(null);
  readonly deleting = signal<Warehouse | null>(null);
  readonly query = signal('');
  readonly visible = () => {
    const query = this.query().trim().toLowerCase();
    return this.warehouses().filter((warehouse) => `${warehouse.name} ${warehouse.location}`.toLowerCase().includes(query));
  };
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    location: ['', [Validators.required, Validators.maxLength(180)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.get<Warehouse[]>('/warehouses').subscribe({ next: (data) => this.warehouses.set(data), error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }
  startCreate(): void { this.editing.set(null); this.form.reset({ name: '', location: '', capacity: 1 }); this.modalOpen.set(true); }
  startEdit(warehouse: Warehouse): void { this.editing.set(warehouse); this.form.reset(warehouse); this.modalOpen.set(true); }
  closeModal(): void { if (!this.saving()) this.modalOpen.set(false); }
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const warehouse = this.editing();
    const payload = { ...this.form.getRawValue(), capacity: Number(this.form.controls.capacity.value) };
    this.saving.set(true);
    const request = warehouse ? this.api.put<Warehouse>(`/warehouses/${warehouse.id}`, payload)
      : this.api.post<Warehouse>('/warehouses', payload);
    request.subscribe({
      next: () => { this.modalOpen.set(false); this.notice.show(warehouse ? 'Warehouse updated.' : 'Warehouse added.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
  remove(): void {
    const warehouse = this.deleting();
    if (!warehouse || this.saving()) return;
    this.saving.set(true);
    this.api.delete(`/warehouses/${warehouse.id}`).subscribe({
      next: () => { this.deleting.set(null); this.notice.show('Warehouse deleted.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
}