import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, NoticeService, Supplier } from './api';
import { ConfirmDialog } from './shared/confirm-dialog';
import { Modal } from './shared/modal';

@Component({
  selector: 'app-suppliers',
  imports: [ReactiveFormsModule, Modal, ConfirmDialog],
  template: `
    <section class="page-heading"><div><p class="eyebrow">PARTNERS</p><h1>Suppliers</h1><p class="page-subtitle">Keep vendor contacts and sourcing details in one place.</p></div><button class="button button-dark" type="button" (click)="startCreate()"><span class="button-plus">+</span> Add supplier</button></section>
    <section class="surface-panel page-panel"><div class="toolbar"><div class="toolbar-title"><strong>Supplier directory</strong><span class="count-chip">{{ suppliers().length }} partners</span></div><label class="search-field"><span>⌕</span><input type="search" placeholder="Search suppliers" (input)="query.set($any($event.target).value)" /></label></div>
      @if (loading()) { <div class="loading-state"><span class="spinner"></span>Loading suppliers…</div> }
      @else if (visible().length) { <div class="table-scroll"><table class="data-table"><thead><tr><th>SUPPLIER</th><th>CONTACT</th><th>EMAIL</th><th>PHONE</th><th>ADDRESS</th><th></th></tr></thead><tbody>
        @for (supplier of visible(); track supplier.id) { <tr><td><div class="supplier-avatar">{{ initials(supplier.name) }}</div><span class="table-entity">{{ supplier.name }}</span></td><td>{{ supplier.contactPerson }}</td><td><a class="table-link" [href]="'mailto:' + supplier.email">{{ supplier.email }}</a></td><td>{{ supplier.phone }}</td><td>{{ supplier.address }}</td><td><div class="row-actions"><button class="icon-button" type="button" title="Edit supplier" aria-label="Edit {{ supplier.name }}" (click)="startEdit(supplier)">✎</button><button class="icon-button danger-icon" type="button" title="Delete supplier" aria-label="Delete {{ supplier.name }}" (click)="deleting.set(supplier)">×</button></div></td></tr> }
      </tbody></table></div> }
      @else { <div class="empty-state"><span class="empty-mark">⌂</span><strong>{{ suppliers().length ? 'No matching suppliers' : 'No suppliers yet' }}</strong><p>{{ suppliers().length ? 'Try another search.' : 'Add your first supplier to connect products with their source.' }}</p></div> }
    </section>
    <app-modal [open]="modalOpen()" [title]="editing() ? 'Edit supplier' : 'Add supplier'" (closed)="closeModal()"><form class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <label class="field"><span>Company name <i>*</i></span><input formControlName="name" placeholder="Northstar Wholesale" /></label>
      <label class="field"><span>Contact person <i>*</i></span><input formControlName="contactPerson" placeholder="Morgan Lee" /></label>
      <label class="field"><span>Email <i>*</i></span><input type="email" formControlName="email" placeholder="name@company.com" /><small class="field-error">{{ emailError() }}</small></label>
      <label class="field"><span>Phone <i>*</i></span><input type="tel" formControlName="phone" placeholder="+1 555 0100" /></label>
      <label class="field field-wide"><span>Address <i>*</i></span><textarea rows="2" formControlName="address" placeholder="Street, city"></textarea></label>
      <div class="form-actions field-wide"><button class="button button-quiet" type="button" [disabled]="saving()" (click)="closeModal()">Cancel</button><button class="button button-dark" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Create supplier' }}</button></div>
    </form></app-modal>
    <app-confirm-dialog [open]="!!deleting()" [busy]="saving()" title="Delete supplier?" [message]="'Remove ' + (deleting()?.name || 'this supplier') + '? Products linked to this supplier may prevent deletion.'" confirmText="Delete supplier" (cancelled)="deleting.set(null)" (confirmed)="remove()" />
  `,
})
export class Suppliers implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notice = inject(NoticeService);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Supplier | null>(null);
  readonly deleting = signal<Supplier | null>(null);
  readonly query = signal('');
  readonly visible = () => {
    const query = this.query().trim().toLowerCase();
    return this.suppliers().filter((supplier) => `${supplier.name} ${supplier.contactPerson} ${supplier.email}`.toLowerCase().includes(query));
  };
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    contactPerson: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(40)]],
    address: ['', [Validators.required, Validators.maxLength(240)]],
  });

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.get<Supplier[]>('/suppliers').subscribe({ next: (data) => this.suppliers.set(data), error: () => this.loading.set(false), complete: () => this.loading.set(false) });
  }
  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    this.modalOpen.set(true);
  }
  startEdit(supplier: Supplier): void { this.editing.set(supplier); this.form.reset(supplier); this.modalOpen.set(true); }
  closeModal(): void { if (!this.saving()) this.modalOpen.set(false); }
  emailError(): string {
    const control = this.form.controls.email;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Email is required.';
    return control.hasError('email') ? 'Enter a valid email address.' : '';
  }
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const supplier = this.editing();
    this.saving.set(true);
    const request = supplier ? this.api.put<Supplier>(`/suppliers/${supplier.id}`, this.form.getRawValue())
      : this.api.post<Supplier>('/suppliers', this.form.getRawValue());
    request.subscribe({
      next: () => { this.modalOpen.set(false); this.notice.show(supplier ? 'Supplier updated.' : 'Supplier added.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
  remove(): void {
    const supplier = this.deleting();
    if (!supplier || this.saving()) return;
    this.saving.set(true);
    this.api.delete(`/suppliers/${supplier.id}`).subscribe({
      next: () => { this.deleting.set(null); this.notice.show('Supplier deleted.'); this.load(); },
      error: () => this.saving.set(false), complete: () => this.saving.set(false),
    });
  }
}