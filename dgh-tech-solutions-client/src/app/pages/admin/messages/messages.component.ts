import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContactService } from '../../../core/services/contact.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ContactMessage, SiteSettings } from '../../../core/models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Messages</h1>
        @if (newCount() > 0) {
          <span class="unread-badge">{{ newCount() }} new</span>
        }
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">&#8635; Refresh</button>
      </div>

      @if (loadError()) {
        <div class="alert-error">{{ loadError() }} <button class="retry-link" (click)="load()">Retry</button></div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading messages…</span>
        </div>
      } @else if (messages().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">&#9993;</div>
          <p>No messages yet.</p>
          <span>Contact form submissions will appear here.</span>
        </div>
      } @else {
        <div class="messages-list">
          @for (m of messages(); track m._id) {
            <div class="message-card" [class.is-new]="m.status === 'new'" [class.is-expanded]="expandedId() === m._id" (click)="expand(m._id)">
              <div class="msg-header">
                <div class="sender">
                  <strong>{{ m.name }}</strong>
                  <span class="email">{{ m.email }}</span>
                  @if (m.company) { <span class="company">&#x1F3E2; {{ m.company }}</span> }
                </div>
                <div class="meta">
                  @if (m.serviceInterest) { <span class="service-tag">{{ m.serviceInterest }}</span> }
                  <span class="date">{{ m.createdAt | date:'MMM d, y' }}</span>
                  <span class="status-badge status-{{ m.status }}">{{ m.status }}</span>
                  <span class="expand-icon">{{ expandedId() === m._id ? '▲' : '▼' }}</span>
                </div>
              </div>

              @if (expandedId() === m._id) {
                <div class="msg-body" (click)="$event.stopPropagation()">
                  @if (m.subject) { <p class="msg-subject"><strong>Subject:</strong> {{ m.subject }}</p> }
                  <p class="msg-text">{{ m.message }}</p>
                  @if (m.phone) { <p class="msg-detail">&#128222; {{ m.phone }}</p> }

                  @if (actionError()[m._id]) {
                    <div class="action-error">{{ actionError()[m._id] }}</div>
                  }

                  <div class="msg-actions">
                    <!-- Reply via Gmail -->
                    <button class="btn-action btn-reply"
                            [disabled]="actionLoading()[m._id]"
                            (click)="openReply(m, $event)">
                      &#9993; Reply via Gmail
                    </button>

                    <!-- Mark as Read -->
                    @if (m.status === 'new') {
                      <button class="btn-action btn-read"
                              [disabled]="actionLoading()[m._id]"
                              (click)="doStatus(m._id, 'read', $event)">
                        {{ actionLoading()[m._id] ? '…' : '&#10003; Mark Read' }}
                      </button>
                    }

                    <!-- Mark as Replied -->
                    @if (m.status === 'new' || m.status === 'read') {
                      <button class="btn-action btn-replied"
                              [disabled]="actionLoading()[m._id]"
                              (click)="doStatus(m._id, 'replied', $event)">
                        {{ actionLoading()[m._id] ? '…' : '&#8617; Mark Replied' }}
                      </button>
                    }

                    <!-- Unarchive / Archive -->
                    @if (m.status === 'archived') {
                      <button class="btn-action btn-read"
                              [disabled]="actionLoading()[m._id]"
                              (click)="doStatus(m._id, 'new', $event)">
                        &#8635; Restore
                      </button>
                    } @else {
                      <button class="btn-action btn-archive"
                              [disabled]="actionLoading()[m._id]"
                              (click)="doStatus(m._id, 'archived', $event)">
                        &#128452; Archive
                      </button>
                    }

                    <!-- Delete -->
                    <button class="btn-action btn-delete"
                            [disabled]="actionLoading()[m._id]"
                            (click)="remove(m._id, $event)">
                      &#128465; Delete
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 900px; }

    /* Header */
    .page-header { display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0; flex:1; }
    .unread-badge { background:var(--clr-primary); color:#fff; font-size:.78rem; font-weight:700; padding:.25rem .8rem; border-radius:999px; }
    .refresh-btn { font-size:.82rem; padding:.35rem .9rem; border:1px solid var(--clr-border); border-radius:6px; background:#fff; cursor:pointer; color:var(--clr-dark); font-weight:600; transition:all .2s; margin-left:auto; }
    .refresh-btn:hover:not(:disabled) { border-color:var(--clr-primary); color:var(--clr-primary); }
    .refresh-btn:disabled { opacity:.5; cursor:not-allowed; }

    /* Alerts */
    .alert-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:.75rem 1rem; border-radius:8px; font-size:.875rem; margin-bottom:1rem; display:flex; align-items:center; gap:.75rem; }
    .retry-link { background:none; border:none; color:#dc2626; font-weight:700; cursor:pointer; text-decoration:underline; padding:0; }
    .action-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:.5rem .75rem; border-radius:6px; font-size:.8rem; margin-bottom:.75rem; }

    /* Loading */
    .loading-state { display:flex; align-items:center; gap:.75rem; padding:3rem 1.5rem; color:var(--clr-text-sub); font-size:.95rem; }
    .spinner { width:20px; height:20px; border:2px solid var(--clr-border); border-top-color:var(--clr-primary); border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Empty state */
    .empty-state { background:#fff; border:1px solid var(--clr-border); border-radius:12px; padding:4rem 2rem; text-align:center; color:var(--clr-text-sub); }
    .empty-icon { font-size:2.5rem; margin-bottom:.75rem; }
    .empty-state p { font-size:1rem; font-weight:600; color:var(--clr-dark); margin:0 0 .25rem; }
    .empty-state span { font-size:.875rem; }

    /* Card */
    .messages-list { display:flex; flex-direction:column; gap:.75rem; }
    .message-card { background:#fff; border-radius:12px; box-shadow:0 2px 16px rgba(0,0,0,.06); overflow:hidden; cursor:pointer; transition:box-shadow .2s; }
    .message-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.1); }
    .message-card.is-new { background:#fafbff; }
    .message-card.is-expanded { box-shadow:0 6px 24px rgba(0,0,0,.12); }

    /* Card header */
    .msg-header { display:flex; align-items:center; justify-content:space-between; padding:1.1rem 1.25rem; gap:1rem; flex-wrap:wrap; }
    .sender { display:flex; flex-direction:column; gap:.2rem; }
    .sender strong { font-size:.95rem; font-weight:700; color:var(--clr-dark); }
    .email   { font-size:.8rem; color:var(--clr-text-sub); }
    .company { font-size:.78rem; color:var(--clr-text-muted); }
    .meta    { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
    .service-tag { font-size:.72rem; font-weight:700; padding:.2rem .65rem; border-radius:6px; background:rgba(var(--clr-primary-rgb),.1); color:var(--clr-primary); white-space:nowrap; }
    .date    { font-size:.78rem; color:var(--clr-text-muted); }
    .expand-icon { font-size:.7rem; color:var(--clr-text-muted); }

    /* Status badges */
    .status-badge { font-size:.68rem; font-weight:800; padding:.2rem .65rem; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
    .status-new      { background:rgba(var(--clr-primary-rgb),.12); color:var(--clr-primary); }
    .status-read     { background:rgba(16,185,129,.12); color:#065f46; }
    .status-replied  { background:rgba(245,158,11,.12); color:#92400e; }
    .status-archived { background:var(--clr-gray-100); color:var(--clr-text-muted); }

    /* Card body */
    .msg-body { padding:1.25rem 1.5rem; border-top:1px solid rgba(0,0,0,.06); cursor:default; }
    .msg-subject { font-size:.85rem; color:var(--clr-text-muted); margin:0 0 .75rem; }
    .msg-text    { color:var(--clr-dark); line-height:1.75; margin:0 0 .75rem; font-size:.93rem; white-space:pre-wrap; }
    .msg-detail  { font-size:.83rem; color:var(--clr-text-muted); margin:0 0 1rem; }

    /* Action buttons */
    .msg-actions { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:1rem; padding-top:.75rem; border-top:1px solid rgba(0,0,0,.06); }
    .btn-action { font-size:.8rem; padding:.4rem .9rem; border-radius:7px; border:1px solid; cursor:pointer; font-weight:600; transition:all .18s; white-space:nowrap; }
    .btn-action:disabled { opacity:.5; cursor:not-allowed; }
    .btn-reply   { border-color:#2563eb; color:#2563eb; background:rgba(37,99,235,.06); }
    .btn-reply:hover:not(:disabled)   { background:#2563eb; color:#fff; }
    .btn-read    { border-color:#16a34a; color:#16a34a; background:rgba(22,163,74,.06); }
    .btn-read:hover:not(:disabled)    { background:#16a34a; color:#fff; }
    .btn-replied { border-color:#d97706; color:#d97706; background:rgba(217,119,6,.06); }
    .btn-replied:hover:not(:disabled) { background:#d97706; color:#fff; }
    .btn-archive { border-color:var(--clr-gray-400); color:var(--clr-text-muted); background:transparent; }
    .btn-archive:hover:not(:disabled) { background:var(--clr-gray-100); color:var(--clr-dark); }
    .btn-delete  { border-color:#dc2626; color:#dc2626; background:rgba(220,38,38,.06); margin-left:auto; }
    .btn-delete:hover:not(:disabled)  { background:#dc2626; color:#fff; }

    @media (max-width: 600px) {
      .msg-header { flex-direction:column; align-items:flex-start; }
      .meta { justify-content:flex-start; }
      .btn-delete { margin-left:0; }
    }
  `],
})
export class MessagesComponent implements OnInit {
  messages      = signal<ContactMessage[]>([]);
  loading       = signal(true);
  loadError     = signal('');
  expandedId    = signal<string | null>(null);
  actionLoading = signal<Record<string, boolean>>({});
  actionError   = signal<Record<string, string>>({});

  private settings: SiteSettings | null = null;
  private destroyRef = inject(DestroyRef);

  newCount = () => this.messages().filter(m => m.status === 'new').length;

  constructor(
    private contactSvc: ContactService,
    private settingsSvc: SettingsService,
  ) {}

  ngOnInit(): void {
    this.settingsSvc.get().subscribe();
    this.settingsSvc.latest$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.settings = s);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.contactSvc.getMessages().subscribe({
      next: r => { this.messages.set(r.data ?? []); this.loading.set(false); },
      error: () => { this.loadError.set('Failed to load messages. Check your connection.'); this.loading.set(false); },
    });
  }

  expand(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  doStatus(id: string, status: ContactMessage['status'], e: Event): void {
    e.stopPropagation();
    this.setLoading(id, true);
    this.setError(id, '');
    this.contactSvc.updateStatus(id, status).subscribe({
      next: () => {
        this.messages.update(list => list.map(m => m._id === id ? { ...m, status } : m));
        this.setLoading(id, false);
      },
      error: () => {
        this.setError(id, 'Failed to update status. Please try again.');
        this.setLoading(id, false);
      },
    });
  }

  openReply(m: ContactMessage, e: Event): void {
    e.stopPropagation();
    const to      = encodeURIComponent(m.email);
    const subject = encodeURIComponent(`Re: ${m.subject || m.serviceInterest || 'Your Inquiry'}`);

    const biz      = this.settings?.businessName || 'DGH TECH SOLUTIONS';
    const bizEmail = this.settings?.email        || 'contact@dghtechsolutions.com';

    const bodyLines = [
      `Hello ${m.name},`,
      '',
      `Thank you for contacting ${biz}.`,
      '',
      '[Write your response here]',
      '',
      `Best regards,`,
      biz,
      `Email: ${bizEmail}`,
    ];

    const body = encodeURIComponent(bodyLines.join('\n'));
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
      '_blank',
      'noopener,noreferrer'
    );

    // Auto-mark as replied if it was new or read
    if (m.status === 'new' || m.status === 'read') {
      this.doStatus(m._id, 'replied', new Event('click'));
    }
  }

  remove(id: string, e: Event): void {
    e.stopPropagation();
    if (!confirm('Permanently delete this message?')) return;
    this.setLoading(id, true);
    this.contactSvc.delete(id).subscribe({
      next: () => this.messages.update(list => list.filter(m => m._id !== id)),
      error: () => { this.setError(id, 'Failed to delete message.'); this.setLoading(id, false); },
    });
  }

  private setLoading(id: string, val: boolean): void {
    this.actionLoading.update(m => ({ ...m, [id]: val }));
  }

  private setError(id: string, msg: string): void {
    this.actionError.update(m => ({ ...m, [id]: msg }));
  }
}
