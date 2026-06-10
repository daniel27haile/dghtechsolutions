import { Component, Input } from '@angular/core';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-recent-visits',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3>Daily Visits</h3>
        <span class="sub">Last 7 days</span>
      </div>
      @if (daily.length === 0) {
        <p class="empty">No visit data yet.</p>
      } @else {
        <div class="chart-area">
          <div class="bar-chart">
            @for (d of daily; track d.date) {
              <div class="bar-col" [title]="d.date + ': ' + d.count + ' visits'">
                <span class="count-label">{{ d.count }}</span>
                <div class="bar-track">
                  <div class="bar" [style.height.%]="getHeight(d.count)"></div>
                </div>
                <span class="date-label">{{ d.date | slice:5 }}</span>
              </div>
            }
          </div>
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
    .chart-area { padding:1.25rem 1.5rem 1rem; }
    .bar-chart {
      display:flex; align-items:flex-end; gap:6px;
      height:140px;
    }
    .bar-col {
      display:flex; flex-direction:column; align-items:center;
      gap:4px; flex:1; height:100%; justify-content:flex-end;
      cursor:default;
    }
    .count-label { font-size:.65rem; color:var(--clr-text-muted); min-height:1em; line-height:1; }
    .bar-track { flex:1; width:100%; display:flex; align-items:flex-end; }
    .bar {
      width:100%;
      background: var(--clr-primary);
      border-radius:4px 4px 0 0;
      min-height:4px;
      transition:height .5s ease;
    }
    .date-label { font-size:.65rem; color:var(--clr-text-muted); white-space:nowrap; }
  `],
})
export class RecentVisitsComponent {
  @Input() daily: { date: string; count: number }[] = [];

  getHeight(count: number): number {
    const max = Math.max(...this.daily.map((d) => d.count), 1);
    return Math.max(Math.round((count / max) * 100), count > 0 ? 4 : 0);
  }
}
