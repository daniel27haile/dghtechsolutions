import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { PublisherService } from '../../../core/services/publisher.service';
import { PayoutService } from '../../../core/services/payout.service';
import { PublisherStats, PublisherBalance, PublisherSale, PayoutRequest } from '../../../core/models';

@Component({
  selector: 'app-publisher-dashboard',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div class="pub-page">
      <div class="page-header">
        <div>
          <h1>Creator Dashboard</h1>
          <p class="page-sub">Your resource performance, earnings, and payout overview.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-row">Loading your dashboard...</div>
      } @else if (!hasSales()) {
        <!-- ── Full empty state (no sales yet) ───────────────────────────── -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats()?.resourceCount ?? 0 }}</span>
            <span class="stat-label">Published Resources</span>
          </div>
          <div class="stat-card stat-card--dim"><span class="stat-value">0</span><span class="stat-label">Students Enrolled</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">0</span><span class="stat-label">Units Sold</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">$0.00</span><span class="stat-label">Gross Earnings</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">$0.00</span><span class="stat-label">Platform Fees</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">$0.00</span><span class="stat-label">Net Earnings</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">$0.00</span><span class="stat-label">Available Balance</span></div>
          <div class="stat-card stat-card--dim"><span class="stat-value">$0.00</span><span class="stat-label">Pending Payout</span></div>
        </div>

        <div class="empty-hero">
          <div class="empty-hero__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h2 class="empty-hero__title">Publish your first resource</h2>
          <p class="empty-hero__sub">Once customers purchase your resources, sales, students, revenue, and payout data will appear here.</p>
        </div>

      } @else {
        <!-- ── 8-card stat grid ────────────────────────────────────────────── -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats()?.resourceCount ?? 0 }}</span>
            <span class="stat-label">Published Resources</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ uniqueStudents() }}</span>
            <span class="stat-label">Students Enrolled</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats()?.salesCount ?? 0 }}</span>
            <span class="stat-label">Units Sold</span>
          </div>
          <div class="stat-card stat-card--green">
            <span class="stat-value">{{ (stats()?.grossRevenue ?? 0) | currency }}</span>
            <span class="stat-label">Gross Earnings</span>
          </div>
          <div class="stat-card stat-card--red">
            <span class="stat-value">{{ (stats()?.platformFees ?? 0) | currency }}</span>
            <span class="stat-label">Platform Fees</span>
          </div>
          <div class="stat-card stat-card--blue">
            <span class="stat-value">{{ (stats()?.netRevenue ?? 0) | currency }}</span>
            <span class="stat-label">Net Earnings</span>
          </div>
          <div class="stat-card stat-card--teal">
            <span class="stat-value">{{ (balance()?.net ?? 0) | currency }}</span>
            <span class="stat-label">Available Balance</span>
          </div>
          <div class="stat-card stat-card--amber">
            <span class="stat-value">{{ pendingPayoutAmount() | currency }}</span>
            <span class="stat-label">Pending Payout</span>
          </div>
        </div>

        <!-- ── Two-column: payout card + top resources ──────────────────── -->
        <div class="two-col">

          <!-- Payout card -->
          <div class="payout-card">
            <h2 class="section-label">Payout Summary</h2>
            <div class="payout-breakdown">
              <div class="payout-row">
                <span class="payout-row__key">Gross Unpaid</span>
                <span class="payout-row__val">{{ (balance()?.gross ?? 0) | currency }}</span>
              </div>
              <div class="payout-row payout-row--fee">
                <span class="payout-row__key">Platform Fee ({{ balance()?.platformFeePercent ?? 20 }}%)</span>
                <span class="payout-row__val">-{{ (balance()?.feeTotal ?? 0) | currency }}</span>
              </div>
              <div class="payout-row payout-row--net">
                <span class="payout-row__key">Available to Request</span>
                <span class="payout-row__val payout-row__val--net">{{ (balance()?.net ?? 0) | currency }}</span>
              </div>
            </div>
            @if (balance()?.lastPayoutDate) {
              <p class="payout-meta">Last payout: <strong>{{ balance()!.lastPayoutDate | date:'MMM d, y' }}</strong></p>
            }
            @if (balance()?.nextEligibleDate) {
              <p class="payout-meta">Next eligible: <strong>{{ balance()!.nextEligibleDate | date:'MMM d, y' }}</strong></p>
            }
            <div class="payout-actions">
              @if (payoutSuccess()) {
                <p class="payout-success">Payout request submitted!</p>
              }
              @if (payoutError()) {
                <p class="payout-error">{{ payoutError() }}</p>
              }
              <button
                class="btn btn-primary btn-payout"
                [disabled]="payoutRequesting() || !(balance()?.isEligible)"
                (click)="requestPayout()"
              >{{ payoutRequesting() ? 'Requesting...' : 'Request Payout' }}</button>
              @if (balance()?.ineligibleReason) {
                <p class="payout-hint">{{ balance()!.ineligibleReason }}</p>
              }
            </div>
          </div>

          <!-- Top resources -->
          <div class="top-resources">
            <h2 class="section-label">Top Resources</h2>
            @if (topResources().length === 0) {
              <div class="inner-empty">No sales data yet.</div>
            } @else {
              <div class="top-list">
                @for (r of topResources(); track r.resourceId; let i = $index) {
                  <div class="top-item">
                    <span class="top-rank">#{{ i + 1 }}</span>
                    <div class="top-item__info">
                      <span class="top-item__title">{{ r.title }}</span>
                      <span class="top-item__meta">{{ r.units }} sold &middot; {{ r.students }} students</span>
                    </div>
                    <span class="top-item__net">{{ r.net | currency }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- ── Recent Sales ────────────────────────────────────────────────── -->
        <div class="section-header">
          <h2 class="section-label">Recent Sales</h2>
          <span class="section-count">{{ sales().length }} total</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Resource</th>
                <th>Buyer</th>
                <th>Gross</th>
                <th>Platform Fee</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              @for (s of recentSales(); track s.orderId) {
                <tr>
                  <td class="td-muted">{{ s.paidAt | date:'MMM d, y' }}</td>
                  <td class="td-title">{{ s.resourceTitle }}</td>
                  <td class="td-muted">{{ s.buyer?.email ?? '—' }}</td>
                  <td>{{ s.priceAtPurchase | currency }}</td>
                  <td class="td-fee">-{{ s.platformFeeAmount | currency }}</td>
                  <td class="td-net">{{ s.publisherNet | currency }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .pub-page { max-width:1100px; }
    .page-header { margin-bottom:1.5rem; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0 0 .2rem; }
    .page-sub { font-size:.875rem; color:var(--clr-text-muted); margin:0; }

    /* ── Stat grid ─────────────────────────────────────────────────────────── */
    .stats-grid {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:1rem;
      margin-bottom:1.5rem;
    }
    @media(max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:480px) { .stats-grid { grid-template-columns:1fr 1fr; } }

    .stat-card {
      background:#fff;
      border:1.5px solid #e5e7eb;
      border-radius:12px;
      padding:1.25rem 1.4rem;
      display:flex;
      flex-direction:column;
      gap:.3rem;
    }
    .stat-card--dim   { opacity:.45; }
    .stat-card--green { border-color:#86efac; }
    .stat-card--blue  { border-color:#93c5fd; }
    .stat-card--red   { border-color:#fca5a5; }
    .stat-card--teal  { border-color:#5eead4; }
    .stat-card--amber { border-color:#fcd34d; }

    .stat-value { font-size:1.5rem; font-weight:800; color:var(--clr-dark); line-height:1.1; }
    .stat-label { font-size:.72rem; font-weight:600; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; }

    /* ── Empty hero ───────────────────────────────────────────────────────── */
    .empty-hero {
      background:#fff;
      border:1.5px dashed #e5e7eb;
      border-radius:16px;
      padding:4rem 2rem;
      text-align:center;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:1rem;
    }
    .empty-hero__icon { width:80px; height:80px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty-hero__title { font-size:1.25rem; font-weight:700; color:var(--clr-dark); margin:0; }
    .empty-hero__sub   { font-size:.9rem; color:var(--clr-text-muted); margin:0; max-width:42ch; line-height:1.6; }

    /* ── Two-col layout ───────────────────────────────────────────────────── */
    .two-col {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:1rem;
      margin-bottom:1.5rem;
    }
    @media(max-width:768px) { .two-col { grid-template-columns:1fr; } }

    /* ── Payout card ──────────────────────────────────────────────────────── */
    .payout-card {
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:1.5rem;
      display:flex;
      flex-direction:column;
      gap:1rem;
    }
    .payout-breakdown { display:flex; flex-direction:column; gap:.5rem; }
    .payout-row { display:flex; justify-content:space-between; align-items:center; font-size:.875rem; }
    .payout-row__key { color:var(--clr-text-muted); }
    .payout-row__val { font-weight:600; color:var(--clr-dark); }
    .payout-row--fee .payout-row__val { color:#dc2626; }
    .payout-row--net { border-top:1px solid #f3f4f6; padding-top:.5rem; margin-top:.25rem; }
    .payout-row--net .payout-row__key { font-weight:700; color:var(--clr-dark); }
    .payout-row__val--net { font-size:1.15rem; font-weight:800; color:#16a34a; }
    .payout-meta { margin:0; font-size:.8rem; color:var(--clr-text-muted); }
    .payout-meta strong { color:var(--clr-dark); }
    .payout-actions { display:flex; flex-direction:column; gap:.5rem; }
    .payout-success { font-size:.82rem; color:#16a34a; font-weight:600; margin:0; }
    .payout-error   { font-size:.82rem; color:#dc2626; margin:0; }
    .payout-hint    { font-size:.78rem; color:var(--clr-text-muted); margin:0; }

    /* ── Top resources ────────────────────────────────────────────────────── */
    .top-resources {
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:1.5rem;
      display:flex;
      flex-direction:column;
      gap:1rem;
    }
    .top-list { display:flex; flex-direction:column; gap:.5rem; }
    .top-item {
      display:flex;
      align-items:center;
      gap:.85rem;
      padding:.65rem .85rem;
      border:1px solid #f3f4f6;
      border-radius:8px;
    }
    .top-rank { font-size:.75rem; font-weight:800; color:var(--clr-text-muted); width:1.5rem; text-align:center; flex-shrink:0; }
    .top-item__info { flex:1; min-width:0; }
    .top-item__title { display:block; font-size:.875rem; font-weight:600; color:var(--clr-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .top-item__meta  { display:block; font-size:.72rem; color:var(--clr-text-muted); margin-top:.1rem; }
    .top-item__net   { font-size:.875rem; font-weight:700; color:#16a34a; flex-shrink:0; }
    .inner-empty { padding:2rem 1rem; text-align:center; color:var(--clr-text-muted); font-size:.875rem; }

    /* ── Section label / header ───────────────────────────────────────────── */
    .section-label {
      font-size:.8rem;
      font-weight:700;
      color:var(--clr-text-muted);
      text-transform:uppercase;
      letter-spacing:.06em;
      margin:0;
    }
    .section-header { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
    .section-count  { font-size:.72rem; font-weight:700; background:rgba(37,99,235,.1); color:#2563eb; padding:.15rem .55rem; border-radius:20px; }

    /* ── Table ────────────────────────────────────────────────────────────── */
    .table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .data-table thead tr { background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .data-table th { padding:.75rem 1rem; text-align:left; font-size:.72rem; font-weight:700; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .data-table td { padding:.85rem 1rem; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .td-title { font-weight:600; color:var(--clr-dark); }
    .td-muted { color:var(--clr-text-muted); font-size:.82rem; }
    .td-fee   { color:#dc2626; }
    .td-net   { font-weight:700; color:#16a34a; }

    /* ── Misc ─────────────────────────────────────────────────────────────── */
    .loading-row { padding:3rem; color:var(--clr-text-muted); text-align:center; }

    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.4rem; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s; padding:.6rem 1.4rem; font-size:.875rem; }
    .btn-primary { background:var(--clr-primary); color:#fff; }
    .btn-primary:hover:not(:disabled) { background:var(--clr-primary-hover); }
    .btn-payout { width:100%; }
    .btn:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class PublisherDashboardComponent implements OnInit {
  loading          = signal(true);
  stats            = signal<PublisherStats | null>(null);
  balance          = signal<PublisherBalance | null>(null);
  sales            = signal<PublisherSale[]>([]);
  payouts          = signal<PayoutRequest[]>([]);
  payoutRequesting = signal(false);
  payoutError      = signal('');
  payoutSuccess    = signal(false);

  hasSales = computed(() => this.sales().length > 0);

  uniqueStudents = computed(() => {
    const ids = new Set<string>();
    for (const s of this.sales()) {
      if (s.buyer?._id) ids.add(s.buyer._id);
    }
    return ids.size;
  });

  pendingPayoutAmount = computed(() =>
    this.payouts()
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.netAmount, 0)
  );

  topResources = computed(() => {
    const map = new Map<string, { resourceId: string; title: string; units: number; net: number; students: Set<string> }>();
    for (const s of this.sales()) {
      let r = map.get(s.resourceId);
      if (!r) { r = { resourceId: s.resourceId, title: s.resourceTitle, units: 0, net: 0, students: new Set() }; map.set(s.resourceId, r); }
      r.units++;
      r.net += s.publisherNet;
      if (s.buyer?._id) r.students.add(s.buyer._id);
    }
    return [...map.values()]
      .sort((a, b) => b.net - a.net)
      .slice(0, 5)
      .map(r => ({ ...r, students: r.students.size }));
  });

  recentSales = computed(() => this.sales().slice(0, 15));

  constructor(
    private publisherSvc: PublisherService,
    private payoutSvc:    PayoutService,
  ) {}

  ngOnInit(): void {
    let done = 0;
    const finish = () => { if (++done === 4) this.loading.set(false); };

    this.publisherSvc.getMyStats().subscribe({
      next: (r) => { this.stats.set(r.data ?? null); finish(); },
      error: () => finish(),
    });
    this.payoutSvc.getBalance().subscribe({
      next: (r) => { this.balance.set(r.data ?? null); finish(); },
      error: () => finish(),
    });
    this.publisherSvc.getMySales().subscribe({
      next: (r) => { this.sales.set(r.data ?? []); finish(); },
      error: () => finish(),
    });
    this.payoutSvc.getAll().subscribe({
      next: (r) => { this.payouts.set(r.data ?? []); finish(); },
      error: () => finish(),
    });
  }

  requestPayout(): void {
    this.payoutError.set('');
    this.payoutSuccess.set(false);
    this.payoutRequesting.set(true);
    this.payoutSvc.requestPayout().subscribe({
      next: () => {
        this.payoutRequesting.set(false);
        this.payoutSuccess.set(true);
        this.payoutSvc.getBalance().subscribe({
          next: (r) => this.balance.set(r.data ?? null),
          error: () => {},
        });
        this.payoutSvc.getAll().subscribe({
          next: (r) => this.payouts.set(r.data ?? []),
          error: () => {},
        });
      },
      error: (e: { error?: { message?: string } }) => {
        this.payoutError.set(e?.error?.message || 'Failed to request payout.');
        this.payoutRequesting.set(false);
      },
    });
  }
}
