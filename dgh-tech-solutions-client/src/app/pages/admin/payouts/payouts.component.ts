import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { PayoutService } from '../../../core/services/payout.service';
import { PayoutRequest, PayoutStatus } from '../../../core/models';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Payout Requests</h1>
          <p class="page-sub">Review and manage publisher payout requests.</p>
        </div>
      </div>

      <!-- Summary chips -->
      <div class="summary-row">
        @for (s of summaryCards(); track s.label) {
          <div class="summary-card" [class.summary-card--active]="statusFilter() === s.filter" (click)="statusFilter.set(s.filter)">
            <span class="summary-card__count">{{ s.count }}</span>
            <span class="summary-card__label">{{ s.label }}</span>
          </div>
        }
      </div>

      <!-- Reject modal -->
      @if (rejectingId()) {
        <div class="modal-backdrop" (click)="cancelReject()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <h3>Reject Payout</h3>
            <p>Provide a reason (optional):</p>
            <textarea class="form-control" [(ngModel)]="rejectReason" rows="3" placeholder="Reason..."></textarea>
            <div class="modal-actions">
              <button class="btn btn-danger btn-sm" [disabled]="actionSaving()" (click)="confirmReject()">
                {{ actionSaving() ? 'Rejecting...' : 'Reject' }}
              </button>
              <button class="btn btn-ghost btn-sm" (click)="cancelReject()">Cancel</button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading-row">Loading payout requests...</div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">No payout requests{{ statusFilter() ? ' with status "' + statusFilter() + '"' : '' }}.</div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Publisher</th>
                <th>Requested</th>
                <th>Gross</th>
                <th>Platform Fee</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p._id) {
                <tr>
                  <td class="td-publisher">
                    <span class="pub-name">{{ publisherName(p) }}</span>
                    <span class="pub-email">{{ publisherEmail(p) }}</span>
                  </td>
                  <td class="td-muted">{{ p.createdAt | date:'MMM d, y' }}</td>
                  <td>{{ p.grossAmount | currency }}</td>
                  <td class="td-fee">-{{ p.platformFeeAmount | currency }}</td>
                  <td class="td-net">{{ p.netAmount | currency }}</td>
                  <td><span class="status-badge status-{{ p.status }}">{{ p.status }}</span></td>
                  <td class="td-dates td-muted">
                    @if (p.approvedAt) { <div>Approved: {{ p.approvedAt | date:'MMM d' }}</div> }
                    @if (p.paidAt)     { <div>Paid: {{ p.paidAt | date:'MMM d' }}</div> }
                    @if (p.rejectedAt) { <div>Rejected: {{ p.rejectedAt | date:'MMM d' }}</div> }
                  </td>
                  <td class="td-actions">
                    @if (p.status === 'pending') {
                      <button class="action-btn action-btn--success" [disabled]="actionSaving()" (click)="approve(p._id!)">Approve</button>
                      <button class="action-btn action-btn--danger" [disabled]="actionSaving()" (click)="startReject(p._id!)">Reject</button>
                    }
                    @if (p.status === 'approved') {
                      <button class="action-btn action-btn--primary" [disabled]="actionSaving()" (click)="markPaid(p._id!)">Mark Paid</button>
                      <button class="action-btn action-btn--danger" [disabled]="actionSaving()" (click)="startReject(p._id!)">Reject</button>
                    }
                    @if (p.status === 'paid' || p.status === 'rejected') {
                      <span class="td-muted" style="font-size:.78rem">—</span>
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
    .admin-page { max-width:1200px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.25rem; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0 0 .2rem; }
    .page-sub { font-size:.875rem; color:var(--clr-text-muted); margin:0; }
    .summary-row { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .summary-card { display:flex; flex-direction:column; align-items:center; background:#fff; border:1.5px solid #e5e7eb; border-radius:10px; padding:.85rem 1.25rem; cursor:pointer; min-width:90px; transition:all .15s; }
    .summary-card:hover { border-color:#93c5fd; }
    .summary-card--active { border-color:#2563eb; background:#eff6ff; }
    .summary-card__count { font-size:1.5rem; font-weight:800; color:var(--clr-dark); }
    .summary-card__label { font-size:.72rem; font-weight:600; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal-box { background:#fff; border-radius:14px; padding:1.5rem; width:min(420px,90vw); }
    .modal-box h3 { margin:0 0 .5rem; font-size:1.05rem; }
    .modal-box p { margin:0 0 .75rem; font-size:.875rem; color:var(--clr-text-muted); }
    .modal-actions { display:flex; gap:.75rem; margin-top:1rem; }
    .table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .data-table thead tr { background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .data-table th { padding:.75rem 1rem; text-align:left; font-size:.75rem; font-weight:700; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .data-table td { padding:.85rem 1rem; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .td-publisher { display:flex; flex-direction:column; }
    .pub-name { font-weight:600; color:var(--clr-dark); }
    .pub-email { font-size:.78rem; color:var(--clr-text-muted); }
    .td-muted { color:var(--clr-text-muted); font-size:.8rem; }
    .td-fee { color:#dc2626; }
    .td-net { font-weight:700; color:#16a34a; }
    .td-dates { font-size:.78rem; line-height:1.6; }
    .td-actions { display:flex; gap:.4rem; flex-wrap:wrap; }
    .status-badge { display:inline-block; padding:.2rem .65rem; border-radius:999px; font-size:.72rem; font-weight:700; text-transform:capitalize; }
    .status-pending  { background:#fef3c7; color:#92400e; }
    .status-approved { background:#dbeafe; color:#1e40af; }
    .status-paid     { background:#dcfce7; color:#166534; }
    .status-rejected { background:#fee2e2; color:#991b1b; }
    .action-btn { background:none; border:1px solid #e5e7eb; border-radius:6px; padding:.3rem .65rem; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .15s; }
    .action-btn--success { color:#16a34a; border-color:#86efac; }
    .action-btn--success:hover { background:#dcfce7; }
    .action-btn--danger  { color:#dc2626; border-color:#fca5a5; }
    .action-btn--danger:hover  { background:#fef2f2; }
    .action-btn--primary { color:#1d4ed8; border-color:#93c5fd; }
    .action-btn--primary:hover { background:#eff6ff; }
    .action-btn:disabled { opacity:.4; cursor:not-allowed; }
    .loading-row { padding:2rem; color:var(--clr-text-muted); text-align:center; }
    .empty-state { padding:3rem 2rem; text-align:center; color:var(--clr-text-muted); background:#fff; border:1px solid #e5e7eb; border-radius:12px; }
    .form-control { width:100%; padding:.55rem .85rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.875rem; font-family:inherit; outline:none; box-sizing:border-box; }
    .form-control:focus { border-color:#2563eb; }
    .btn { display:inline-flex; align-items:center; gap:.4rem; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s; }
    .btn-danger { background:#dc2626; color:#fff; }
    .btn-danger:hover:not(:disabled) { background:#b91c1c; }
    .btn-ghost { background:none; color:var(--clr-text-muted); border:1px solid #e5e7eb; }
    .btn-ghost:hover { background:#f3f4f6; }
    .btn-sm { padding:.45rem 1rem; font-size:.85rem; }
    .btn:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class AdminPayoutsComponent implements OnInit {
  payouts      = signal<PayoutRequest[]>([]);
  loading      = signal(true);
  actionSaving = signal(false);
  statusFilter = signal<PayoutStatus | ''>('');
  rejectingId  = signal<string | null>(null);
  rejectReason = '';

  filtered = computed(() => {
    const f = this.statusFilter();
    return f ? this.payouts().filter(p => p.status === f) : this.payouts();
  });

  summaryCards = computed(() => {
    const all = this.payouts();
    const count = (s: string) => all.filter(p => p.status === s).length;
    return [
      { label: 'All',      count: all.length,        filter: '' as PayoutStatus | '' },
      { label: 'Pending',  count: count('pending'),   filter: 'pending'  as PayoutStatus },
      { label: 'Approved', count: count('approved'),  filter: 'approved' as PayoutStatus },
      { label: 'Paid',     count: count('paid'),      filter: 'paid'     as PayoutStatus },
      { label: 'Rejected', count: count('rejected'),  filter: 'rejected' as PayoutStatus },
    ];
  });

  constructor(private svc: PayoutService) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: (r) => { this.payouts.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  publisherName(p: PayoutRequest): string {
    const pub = p.publisherId;
    if (typeof pub === 'object' && pub !== null) return pub.fullName ?? pub.publisherName ?? '—';
    return String(pub);
  }

  publisherEmail(p: PayoutRequest): string {
    const pub = p.publisherId;
    if (typeof pub === 'object' && pub !== null) return pub.email ?? '';
    return '';
  }

  approve(id: string): void {
    this.actionSaving.set(true);
    this.svc.approve(id).subscribe({
      next: (r) => { this.updatePayout(r.data!); this.actionSaving.set(false); },
      error: () => this.actionSaving.set(false),
    });
  }

  startReject(id: string): void {
    this.rejectReason = '';
    this.rejectingId.set(id);
  }

  cancelReject(): void { this.rejectingId.set(null); }

  confirmReject(): void {
    const id = this.rejectingId()!;
    this.actionSaving.set(true);
    this.svc.reject(id, this.rejectReason).subscribe({
      next: (r) => {
        this.updatePayout(r.data!);
        this.actionSaving.set(false);
        this.rejectingId.set(null);
      },
      error: () => this.actionSaving.set(false),
    });
  }

  markPaid(id: string): void {
    this.actionSaving.set(true);
    this.svc.markPaid(id).subscribe({
      next: (r) => { this.updatePayout(r.data!); this.actionSaving.set(false); },
      error: () => this.actionSaving.set(false),
    });
  }

  private updatePayout(updated: PayoutRequest): void {
    this.payouts.update(list => list.map(p => p._id === updated._id ? updated : p));
  }
}
