import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-pages',
  standalone: true,
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3>Top Pages</h3>
        <span class="sub">Last 30 days</span>
      </div>
      @if (pages.length === 0) {
        <p class="empty">No page data yet.</p>
      } @else {
        <div class="pages-list">
          @for (p of pages; track p.path; let i = $index) {
            <div class="page-row">
              <span class="rank">{{ i + 1 }}</span>
              <span class="path" [title]="p.path">{{ p.path }}</span>
              <div class="bar-wrap">
                <div class="bar" [style.width.%]="getWidth(p.count)"></div>
              </div>
              <span class="count">{{ p.count }}</span>
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
    .sub { font-size:.78rem; color:var(--clr-text-muted); }
    .empty { padding:2rem 1.5rem; color:var(--clr-text-muted); font-size:.875rem; }
    .pages-list { padding:.5rem 0; }
    .page-row {
      display:flex; align-items:center; gap:.75rem;
      padding:.55rem 1.5rem; transition:background .15s;
    }
    .page-row:hover { background:var(--clr-gray-50); }
    .rank { font-size:.72rem; font-weight:700; color:var(--clr-text-muted); width:16px; flex-shrink:0; text-align:center; }
    .path {
      font-size:.8rem; color:var(--clr-text-sub); flex:1;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      font-family:monospace;
    }
    .bar-wrap { width:70px; height:6px; background:var(--clr-gray-100); border-radius:3px; overflow:hidden; flex-shrink:0; }
    .bar { height:100%; background:var(--clr-primary); border-radius:3px; transition:width .4s ease; opacity:.7; }
    .count { font-size:.78rem; font-weight:700; color:var(--clr-dark); width:28px; text-align:right; flex-shrink:0; }
  `],
})
export class TopPagesComponent {
  @Input() pages: { path: string; count: number }[] = [];

  getWidth(count: number): number {
    const max = Math.max(...this.pages.map((p) => p.count), 1);
    return Math.round((count / max) * 100);
  }
}
