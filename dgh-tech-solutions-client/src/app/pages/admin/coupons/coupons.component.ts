import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { ResourceService } from '../../../core/services/resource.service';
import { Coupon, Resource } from '../../../core/models';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Coupons</h1>
          <p class="page-sub">Create and manage discount codes for your resources.</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="openCreate()">+ New Coupon</button>
      </div>

      <!-- Form panel -->
      @if (formMode()) {
        <div class="form-panel">
          <h2 class="form-title">{{ formMode() === 'create' ? 'Create Coupon' : 'Edit Coupon' }}</h2>

          <div class="row-3">
            <div class="form-group">
              <label>Code *</label>
              <input class="form-control" [(ngModel)]="f.code" placeholder="SAVE20"
                [disabled]="formMode() === 'edit'" style="text-transform:uppercase" />
            </div>
            <div class="form-group">
              <label>Discount Type *</label>
              <select class="form-control" [(ngModel)]="f.discountType">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Discount Value *</label>
              <input class="form-control" [(ngModel)]="f.discountValue" type="number" min="1"
                [placeholder]="f.discountType === 'percentage' ? '20' : '5.00'" />
            </div>
          </div>

          <div class="row-3">
            <div class="form-group">
              <label>Scope</label>
              <select class="form-control" [(ngModel)]="f.scope">
                <option value="global">Global (all resources)</option>
                <option value="course">Specific resources</option>
              </select>
            </div>
            <div class="form-group">
              <label>Max Redemptions <span class="hint">(blank = unlimited)</span></label>
              <input class="form-control" [(ngModel)]="f.maxRedemptions" type="number" min="1" placeholder="Unlimited" />
            </div>
            <div class="form-group">
              <label>Min Cart Amount ($) <span class="hint">(blank = none)</span></label>
              <input class="form-control" [(ngModel)]="f.minimumCartAmount" type="number" min="0" placeholder="0" />
            </div>
          </div>

          <!-- Resource picker — shown only when scope = 'course' -->
          @if (f.scope === 'course') {
            <div class="form-group">
              <label>
                Select Resources *
                @if (f.selectedCourseIds.length > 0) {
                  <span class="selected-count">{{ f.selectedCourseIds.length }} selected</span>
                }
              </label>

              <!-- Selected tags -->
              @if (f.selectedCourseIds.length > 0) {
                <div class="selected-tags">
                  @for (id of f.selectedCourseIds; track id) {
                    <span class="tag">
                      {{ resourceTitle(id) }}
                      <button class="tag-remove" (click)="toggleResource(id)" type="button">&#215;</button>
                    </span>
                  }
                </div>
              }

              <input class="form-control" [ngModel]="resourceSearch()"
                (ngModelChange)="resourceSearch.set($event)"
                placeholder="Search resources..." />

              <div class="resource-list">
                @if (resourcesLoading()) {
                  <div class="res-list-empty">Loading resources...</div>
                } @else if (filteredResources().length === 0) {
                  <div class="res-list-empty">No resources found.</div>
                } @else {
                  @for (r of filteredResources(); track r._id) {
                    <label class="res-item" [class.res-item--selected]="isSelected(r._id!)">
                      <input type="checkbox" [checked]="isSelected(r._id!)"
                        (change)="toggleResource(r._id!)" />
                      <span class="res-item__title">{{ r.title }}</span>
                      <span class="res-item__type">{{ r.type }}</span>
                      @if (r.isPaid) {
                        <span class="res-item__price">{{ '$' + r.price }}</span>
                      } @else {
                        <span class="res-item__free">Free</span>
                      }
                    </label>
                  }
                }
              </div>
            </div>
          }

          <div class="row-3">
            <div class="form-group">
              <label>Expires At <span class="hint">(blank = never)</span></label>
              <input class="form-control" [(ngModel)]="f.expiresAt" type="date" />
            </div>
            <div class="form-group check-group">
              <label class="check-label">
                <input type="checkbox" [(ngModel)]="f.oneTimePerUser" />
                One-time per user
              </label>
            </div>
            <div class="form-group check-group">
              <label class="check-label">
                <input type="checkbox" [(ngModel)]="f.active" />
                Active
              </label>
            </div>
          </div>

          @if (formError()) { <div class="alert-error">{{ formError() }}</div> }
          <div class="form-actions">
            <button class="btn btn-primary btn-sm" [disabled]="formSaving()" (click)="submitForm()">
              {{ formSaving() ? 'Saving...' : (formMode() === 'create' ? 'Create Coupon' : 'Save Changes') }}
            </button>
            <button class="btn btn-ghost btn-sm" (click)="closeForm()">Cancel</button>
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="loading-row">Loading coupons...</div>
      } @else if (coupons().length === 0) {
        <div class="empty-state">No coupons yet. Create one to offer discounts.</div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Scope</th>
                <th>Resources</th>
                <th>Used</th>
                <th>Max</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of coupons(); track c._id) {
                <tr [class.row-inactive]="!c.active">
                  <td class="td-code">{{ c.code }}</td>
                  <td>
                    @if (c.discountType === 'percentage') {
                      <span class="badge badge-pct">{{ c.discountValue }}% off</span>
                    } @else {
                      <span class="badge badge-fixed">{{ '$' + c.discountValue }} off</span>
                    }
                  </td>
                  <td class="td-muted td-cap">{{ c.scope }}</td>
                  <td class="td-muted">
                    @if (c.scope === 'course' && c.courseIds?.length) {
                      <span class="res-count">{{ c.courseIds!.length }} resource(s)</span>
                    } @else {
                      —
                    }
                  </td>
                  <td class="td-muted">{{ c.redemptionCount ?? 0 }}</td>
                  <td class="td-muted">{{ c.maxRedemptions ?? '∞' }}</td>
                  <td class="td-muted">{{ c.expiresAt ? (c.expiresAt | date:'MMM d, y') : '—' }}</td>
                  <td>
                    <span class="status-badge" [class.status-active]="c.active" [class.status-inactive]="!c.active">
                      {{ c.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="td-actions">
                    <button class="action-btn" (click)="openEdit(c)">Edit</button>
                    <button class="action-btn action-btn--danger" (click)="deleteCoupon(c)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width:1100px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0 0 .2rem; }
    .page-sub { font-size:.875rem; color:var(--clr-text-muted); margin:0; }
    .form-panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,.05); }
    .form-title { font-size:1.05rem; font-weight:700; margin:0 0 1.25rem; color:var(--clr-dark); }
    .row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; }
    @media(max-width:700px) { .row-3 { grid-template-columns:1fr; } }
    .form-group { display:flex; flex-direction:column; gap:.35rem; margin-bottom:1rem; }
    label { font-size:.85rem; font-weight:600; color:var(--clr-dark); }
    .hint { font-size:.75rem; font-weight:400; color:var(--clr-text-muted); }
    .selected-count { font-size:.75rem; font-weight:600; color:var(--clr-primary); background:#eff6ff; padding:.1rem .5rem; border-radius:999px; margin-left:.5rem; }
    .selected-tags { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.5rem; }
    .tag { display:inline-flex; align-items:center; gap:.3rem; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:6px; padding:.2rem .55rem; font-size:.78rem; font-weight:600; }
    .tag-remove { background:none; border:none; cursor:pointer; color:#93c5fd; font-size:.9rem; line-height:1; padding:0; display:flex; }
    .tag-remove:hover { color:#1d4ed8; }
    .resource-list { border:1.5px solid #e5e7eb; border-radius:8px; max-height:220px; overflow-y:auto; margin-top:.25rem; }
    .res-list-empty { padding:1rem; color:var(--clr-text-muted); font-size:.85rem; text-align:center; }
    .res-item { display:flex; align-items:center; gap:.65rem; padding:.6rem .85rem; cursor:pointer; border-bottom:1px solid #f3f4f6; transition:background .1s; }
    .res-item:last-child { border-bottom:none; }
    .res-item:hover { background:#f9fafb; }
    .res-item--selected { background:#eff6ff; }
    .res-item input[type=checkbox] { width:15px; height:15px; cursor:pointer; accent-color:var(--clr-primary); flex-shrink:0; }
    .res-item__title { flex:1; font-size:.85rem; font-weight:500; color:var(--clr-dark); }
    .res-item__type { font-size:.72rem; font-weight:600; color:var(--clr-text-muted); background:#f3f4f6; padding:.15rem .45rem; border-radius:4px; }
    .res-item__price { font-size:.78rem; font-weight:700; color:#16a34a; }
    .res-item__free  { font-size:.72rem; color:var(--clr-text-muted); }
    .check-group { justify-content:flex-end; padding-bottom:.2rem; }
    .check-label { display:flex; align-items:center; gap:.5rem; font-size:.875rem; font-weight:600; color:var(--clr-dark); cursor:pointer; }
    .check-label input { width:16px; height:16px; cursor:pointer; accent-color:var(--clr-primary); }
    .form-actions { display:flex; gap:.75rem; margin-top:.5rem; }
    .alert-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:.65rem 1rem; border-radius:8px; font-size:.85rem; margin-bottom:.75rem; }
    .table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .data-table thead tr { background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .data-table th { padding:.75rem 1rem; text-align:left; font-size:.75rem; font-weight:700; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .data-table td { padding:.85rem 1rem; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .row-inactive td { opacity:.5; }
    .td-code { font-family:monospace; font-weight:700; font-size:.9rem; color:var(--clr-dark); letter-spacing:.04em; }
    .td-muted { color:var(--clr-text-muted); font-size:.82rem; }
    .td-cap { text-transform:capitalize; }
    .td-actions { display:flex; gap:.5rem; }
    .res-count { color:var(--clr-primary); font-weight:600; }
    .badge { display:inline-block; padding:.2rem .6rem; border-radius:6px; font-size:.75rem; font-weight:700; }
    .badge-pct   { background:#ede9fe; color:#6d28d9; }
    .badge-fixed { background:#dcfce7; color:#15803d; }
    .status-badge { display:inline-block; padding:.2rem .65rem; border-radius:999px; font-size:.72rem; font-weight:700; }
    .status-active   { background:#dcfce7; color:#16a34a; }
    .status-inactive { background:#f3f4f6; color:#9ca3af; }
    .action-btn { background:none; border:1px solid #e5e7eb; border-radius:6px; padding:.3rem .7rem; font-size:.78rem; font-weight:600; cursor:pointer; color:var(--clr-dark); transition:all .15s; }
    .action-btn:hover { background:#f3f4f6; }
    .action-btn--danger { color:#dc2626; border-color:#fca5a5; }
    .action-btn--danger:hover { background:#fef2f2; }
    .loading-row { padding:2rem; color:var(--clr-text-muted); text-align:center; }
    .empty-state { padding:3rem 2rem; text-align:center; color:var(--clr-text-muted); background:#fff; border:1px solid #e5e7eb; border-radius:12px; }
    .btn { display:inline-flex; align-items:center; gap:.4rem; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s; }
    .btn-primary { background:var(--clr-primary); color:#fff; }
    .btn-primary:hover:not(:disabled) { background:var(--clr-primary-hover); }
    .btn-ghost { background:none; color:var(--clr-text-muted); border:1px solid #e5e7eb; }
    .btn-ghost:hover { background:#f3f4f6; color:var(--clr-dark); }
    .btn-sm { padding:.45rem 1rem; font-size:.85rem; }
    .btn:disabled { opacity:.5; cursor:not-allowed; }
    .form-control { padding:.55rem .85rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.875rem; font-family:inherit; outline:none; width:100%; box-sizing:border-box; }
    .form-control:focus { border-color:var(--clr-primary); }
    select.form-control { background:#fff; }
  `],
})
export class AdminCouponsComponent implements OnInit {
  coupons         = signal<Coupon[]>([]);
  allResources    = signal<Resource[]>([]);
  loading         = signal(true);
  resourcesLoading = signal(false);
  formMode        = signal<FormMode>(null);
  formSaving      = signal(false);
  formError       = signal('');
  resourceSearch  = signal('');

  filteredResources = computed(() => {
    const q = this.resourceSearch().toLowerCase();
    return this.allResources().filter(r =>
      !q || r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
    );
  });

  f: {
    code: string; discountType: 'percentage' | 'fixed'; discountValue: number | null;
    scope: 'global' | 'course'; selectedCourseIds: string[];
    maxRedemptions: number | null; minimumCartAmount: number | null;
    expiresAt: string; oneTimePerUser: boolean; active: boolean;
  } = this.blank();

  private editId: string | null = null;

  constructor(private svc: CouponService, private resourceSvc: ResourceService) {}

  ngOnInit(): void {
    this.load();
    this.loadResources();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (r) => { this.coupons.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadResources(): void {
    this.resourcesLoading.set(true);
    this.resourceSvc.getAll().subscribe({
      next: (r) => { this.allResources.set(r.data ?? []); this.resourcesLoading.set(false); },
      error: () => this.resourcesLoading.set(false),
    });
  }

  private blank() {
    return {
      code: '', discountType: 'percentage' as const, discountValue: null,
      scope: 'global' as const, selectedCourseIds: [] as string[],
      maxRedemptions: null, minimumCartAmount: null,
      expiresAt: '', oneTimePerUser: false, active: true,
    };
  }

  isSelected(id: string): boolean { return this.f.selectedCourseIds.includes(id); }

  toggleResource(id: string): void {
    const ids = this.f.selectedCourseIds;
    const idx = ids.indexOf(id);
    this.f.selectedCourseIds = idx === -1 ? [...ids, id] : ids.filter(x => x !== id);
  }

  resourceTitle(id: string): string {
    return this.allResources().find(r => r._id === id)?.title ?? id;
  }

  openCreate(): void {
    this.f = this.blank();
    this.editId = null;
    this.resourceSearch.set('');
    this.formError.set('');
    this.formMode.set('create');
  }

  openEdit(c: Coupon): void {
    this.f = {
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      scope: (c.scope === 'global' || c.scope === 'course') ? c.scope : 'global',
      selectedCourseIds: [...(c.courseIds ?? [])],
      maxRedemptions: c.maxRedemptions ?? null,
      minimumCartAmount: c.minimumCartAmount ?? null,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      oneTimePerUser: c.oneTimePerUser ?? false,
      active: c.active,
    };
    this.editId = c._id!;
    this.resourceSearch.set('');
    this.formError.set('');
    this.formMode.set('edit');
  }

  closeForm(): void { this.formMode.set(null); this.formError.set(''); }

  submitForm(): void {
    this.formError.set('');
    if (!this.f.code && this.formMode() === 'create') {
      this.formError.set('Code is required.'); return;
    }
    if (!this.f.discountValue || +this.f.discountValue <= 0) {
      this.formError.set('Discount value must be greater than 0.'); return;
    }
    if (this.f.scope === 'course' && this.f.selectedCourseIds.length === 0) {
      this.formError.set('Select at least one resource for a course-scoped coupon.'); return;
    }

    const payload: Partial<Coupon> = {
      discountType:      this.f.discountType,
      discountValue:     +this.f.discountValue,
      scope:             this.f.scope,
      courseIds:         this.f.scope === 'course' ? this.f.selectedCourseIds : [],
      maxRedemptions:    this.f.maxRedemptions ? +this.f.maxRedemptions : undefined,
      minimumCartAmount: this.f.minimumCartAmount ? +this.f.minimumCartAmount : 0,
      expiresAt:         this.f.expiresAt || undefined,
      oneTimePerUser:    this.f.oneTimePerUser,
      active:            this.f.active,
    };

    this.formSaving.set(true);

    if (this.formMode() === 'create') {
      payload['code'] = this.f.code.trim().toUpperCase();
      this.svc.create(payload).subscribe({
        next: (r) => {
          this.coupons.update(list => [r.data!, ...list]);
          this.formSaving.set(false);
          this.closeForm();
        },
        error: (e: { error?: { message?: string } }) => {
          this.formError.set(e?.error?.message || 'Failed to create coupon.');
          this.formSaving.set(false);
        },
      });
    } else {
      this.svc.update(this.editId!, payload).subscribe({
        next: (r) => {
          this.coupons.update(list => list.map(c => c._id === this.editId ? r.data! : c));
          this.formSaving.set(false);
          this.closeForm();
        },
        error: (e: { error?: { message?: string } }) => {
          this.formError.set(e?.error?.message || 'Failed to update coupon.');
          this.formSaving.set(false);
        },
      });
    }
  }

  deleteCoupon(c: Coupon): void {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    this.svc.delete(c._id!).subscribe({
      next: () => this.coupons.update(list => list.filter(x => x._id !== c._id)),
      error: () => {},
    });
  }
}
