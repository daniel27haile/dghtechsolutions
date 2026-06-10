import { Component, Input } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactMessage } from '../../../../core/models';

@Component({
  selector: 'app-recent-messages',
  standalone: true,
  imports: [DatePipe, SlicePipe, RouterLink],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3>Recent Messages</h3>
        <a routerLink="/admin/messages" class="view-all">View all →</a>
      </div>
      @if (messages.length === 0) {
        <p class="empty">No messages yet.</p>
      } @else {
        <div class="msg-list">
          @for (m of messages; track m._id) {
            <div class="msg-item" [class.is-new]="m.status === 'new'">
              <div class="msg-top">
                <div class="msg-sender">
                  <strong>{{ m.name }}</strong>
                  @if (m.company) { <span class="company">· {{ m.company }}</span> }
                </div>
                <div class="msg-right">
                  <span class="status-dot status-{{ m.status }}">{{ m.status }}</span>
                  <span class="date">{{ m.createdAt | date:'MMM d' }}</span>
                </div>
              </div>
              <div class="msg-preview">{{ m.message | slice:0:90 }}{{ m.message.length > 90 ? '…' : '' }}</div>
              @if (m.serviceInterest) {
                <div class="service-tag">{{ m.serviceInterest }}</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel { background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,.05); overflow:hidden; height:100%; }
    .panel-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:1.1rem 1.5rem; border-bottom:1px solid rgba(0,0,0,.06);
    }
    .panel-header h3 { font-size:.95rem; font-weight:700; color:var(--clr-dark); margin:0; }
    .view-all { font-size:.78rem; font-weight:600; color:var(--clr-primary); text-decoration:none; }
    .view-all:hover { text-decoration:underline; }
    .empty { padding:2rem 1.5rem; color:var(--clr-text-muted); font-size:.875rem; }
    .msg-list { }
    .msg-item {
      padding:.9rem 1.5rem; border-bottom:1px solid rgba(0,0,0,.05);
      transition:background .15s;
    }
    .msg-item:last-child { border-bottom:none; }
    .msg-item:hover { background:var(--clr-gray-50); }
    .msg-item.is-new .msg-sender strong { color:var(--clr-primary); }
    .msg-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:.3rem; gap:.5rem; }
    .msg-sender { display:flex; align-items:baseline; gap:.4rem; flex-wrap:wrap; }
    .msg-sender strong { font-size:.875rem; font-weight:700; color:var(--clr-dark); }
    .company { font-size:.75rem; color:var(--clr-text-muted); }
    .msg-right { display:flex; align-items:center; gap:.5rem; flex-shrink:0; }
    .status-dot {
      font-size:.65rem; font-weight:700; text-transform:uppercase;
      padding:.15rem .5rem; border-radius:999px; letter-spacing:.04em; white-space:nowrap;
    }
    .status-new      { background:rgba(var(--clr-primary-rgb),.12); color:var(--clr-primary); }
    .status-read     { background:rgba(16,185,129,.1);  color:#065f46; }
    .status-replied  { background:rgba(245,158,11,.1);  color:#92400e; }
    .status-archived { background:var(--clr-gray-100);  color:var(--clr-text-muted); }
    .date { font-size:.73rem; color:var(--clr-text-muted); }
    .msg-preview { font-size:.8rem; color:var(--clr-text-sub); line-height:1.5; }
    .service-tag { margin-top:.4rem; font-size:.7rem; font-weight:600; color:var(--clr-primary); background:rgba(var(--clr-primary-rgb),.08); padding:.15rem .55rem; border-radius:999px; display:inline-block; }
  `],
})
export class RecentMessagesComponent {
  @Input() messages: ContactMessage[] = [];
}
