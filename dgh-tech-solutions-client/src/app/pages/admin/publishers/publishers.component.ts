import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PublisherService } from '../../../core/services/publisher.service';
import { PublisherAccount } from '../../../core/models';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin-publishers',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Publishers</h1>
          <p class="page-sub">Manage publisher accounts and their access to the platform.</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="openCreate()">+ New Publisher</button>
      </div>

      <!-- Form panel -->
      @if (formMode()) {
        <div class="form-panel">
          <h2 class="form-title">{{ formMode() === 'create' ? 'Create Publisher' : 'Edit Publisher' }}</h2>
          <div class="row-2">
            <div class="form-group">
              <label>Full Name *</label>
              <input class="form-control" [(ngModel)]="f.fullName" placeholder="Jane Doe" />
            </div>
            <div class="form-group">
              <label>Publisher Display Name</label>
              <input class="form-control" [(ngModel)]="f.publisherName" placeholder="Jane's Tech Hub" />
            </div>
          </div>
          <div class="row-2">
            <div class="form-group">
              <label>Username *</label>
              <input class="form-control" [(ngModel)]="f.username" placeholder="janedoe" [disabled]="formMode() === 'edit'" />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input class="form-control" [(ngModel)]="f.email" type="email" [disabled]="formMode() === 'edit'" />
            </div>
          </div>
          <div class="form-group" style="max-width:340px">
            <label>{{ formMode() === 'create' ? 'Password *' : 'New Password (leave blank to keep)' }}</label>
            <input class="form-control" [(ngModel)]="f.password" type="password" />
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea class="form-control" [(ngModel)]="f.bio" rows="3" placeholder="Short bio..."></textarea>
          </div>
          @if (formError()) { <div class="alert-error">{{ formError() }}</div> }
          <div class="form-actions">
            <button class="btn btn-primary btn-sm" [disabled]="formSaving()" (click)="submitForm()">
              {{ formSaving() ? 'Saving...' : (formMode() === 'create' ? 'Create Publisher' : 'Save Changes') }}
            </button>
            <button class="btn btn-ghost btn-sm" (click)="closeForm()">Cancel</button>
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="loading-row">Loading publishers...</div>
      } @else if (publishers().length === 0) {
        <div class="empty-state">
          <p>No publishers yet. Create one to get started.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Publisher Name</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of publishers(); track p._id) {
                <tr [class.row-inactive]="!p.isActive">
                  <td class="td-name">{{ p.fullName }}</td>
                  <td class="td-muted">{{ p.username }}</td>
                  <td class="td-muted">{{ p.email }}</td>
                  <td>{{ p.publisherName || '—' }}</td>
                  <td>
                    <span class="status-badge" [class.status-active]="p.isActive" [class.status-inactive]="!p.isActive">
                      {{ p.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="td-muted">{{ p.createdAt | date:'MMM d, y' }}</td>
                  <td class="td-actions">
                    <button class="action-btn" (click)="openEdit(p)">Edit</button>
                    @if (p.isActive) {
                      <button class="action-btn action-btn--danger" (click)="deactivate(p)">Deactivate</button>
                    }
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
    .admin-page { max-width: 1100px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0 0 .2rem; }
    .page-sub { font-size:.875rem; color:var(--clr-text-muted); margin:0; }
    .form-panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,.05); }
    .form-title { font-size:1.05rem; font-weight:700; margin:0 0 1.25rem; color:var(--clr-dark); }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    @media(max-width:600px) { .row-2 { grid-template-columns:1fr; } }
    .form-group { display:flex; flex-direction:column; gap:.35rem; margin-bottom:1rem; }
    label { font-size:.85rem; font-weight:600; color:var(--clr-dark); }
    .form-actions { display:flex; gap:.75rem; margin-top:1rem; }
    .alert-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:.65rem 1rem; border-radius:8px; font-size:.85rem; margin-bottom:.75rem; }
    .table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .data-table thead tr { background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .data-table th { padding:.75rem 1rem; text-align:left; font-size:.78rem; font-weight:700; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .data-table td { padding:.85rem 1rem; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .row-inactive td { opacity:.55; }
    .td-name { font-weight:600; color:var(--clr-dark); }
    .td-muted { color:var(--clr-text-muted); }
    .td-actions { display:flex; gap:.5rem; }
    .status-badge { display:inline-block; padding:.2rem .65rem; border-radius:999px; font-size:.72rem; font-weight:700; }
    .status-active { background:#dcfce7; color:#16a34a; }
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
  `],
})
export class AdminPublishersComponent implements OnInit {
  private publisherSvc = new (class extends Object {})(  );

  publishers = signal<PublisherAccount[]>([]);
  loading    = signal(true);
  formMode   = signal<FormMode>(null);
  formSaving = signal(false);
  formError  = signal('');

  f: {
    fullName: string; publisherName: string; username: string;
    email: string; password: string; bio: string;
  } = { fullName: '', publisherName: '', username: '', email: '', password: '', bio: '' };

  private editId = signal<string | null>(null);

  constructor(private svc: PublisherService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (r) => { this.publishers.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.f = { fullName: '', publisherName: '', username: '', email: '', password: '', bio: '' };
    this.editId.set(null);
    this.formError.set('');
    this.formMode.set('create');
  }

  openEdit(p: PublisherAccount): void {
    this.f = { fullName: p.fullName, publisherName: p.publisherName ?? '', username: p.username, email: p.email, password: '', bio: p.bio ?? '' };
    this.editId.set(p._id);
    this.formError.set('');
    this.formMode.set('edit');
  }

  closeForm(): void {
    this.formMode.set(null);
    this.formError.set('');
  }

  submitForm(): void {
    this.formError.set('');
    if (this.formMode() === 'create') {
      if (!this.f.fullName || !this.f.username || !this.f.email || !this.f.password) {
        this.formError.set('Full name, username, email and password are required.');
        return;
      }
      this.formSaving.set(true);
      this.svc.create(this.f).subscribe({
        next: (r) => {
          this.publishers.update(list => [r.data!, ...list]);
          this.formSaving.set(false);
          this.closeForm();
        },
        error: (e: { error?: { message?: string } }) => {
          this.formError.set(e?.error?.message || 'Failed to create publisher.');
          this.formSaving.set(false);
        },
      });
    } else {
      const id = this.editId()!;
      const payload: Partial<PublisherAccount & { password?: string }> = {
        fullName: this.f.fullName, publisherName: this.f.publisherName, bio: this.f.bio,
      };
      if (this.f.password) payload['password'] = this.f.password;
      this.formSaving.set(true);
      this.svc.update(id, payload).subscribe({
        next: (r) => {
          this.publishers.update(list => list.map(p => p._id === id ? r.data! : p));
          this.formSaving.set(false);
          this.closeForm();
        },
        error: (e: { error?: { message?: string } }) => {
          this.formError.set(e?.error?.message || 'Failed to update publisher.');
          this.formSaving.set(false);
        },
      });
    }
  }

  deactivate(p: PublisherAccount): void {
    if (!confirm(`Deactivate ${p.fullName}? They will lose access.`)) return;
    this.svc.deactivate(p._id).subscribe({
      next: (r) => this.publishers.update(list => list.map(x => x._id === p._id ? r.data! : x)),
      error: () => {},
    });
  }
}
