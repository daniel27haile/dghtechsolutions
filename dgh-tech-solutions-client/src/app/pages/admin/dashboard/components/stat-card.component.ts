import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="stat-card" [class]="'accent-' + accent">
      <div class="card-icon">{{ icon }}</div>
      <div class="card-body">
        <div class="card-value">{{ value | number }}</div>
        <div class="card-label">{{ label }}</div>
        @if (sublabel) { <div class="card-sub">{{ sublabel }}</div> }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      padding: 1.4rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      transition: box-shadow .2s, transform .2s;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }

    .card-icon {
      font-size: 1.6rem;
      line-height: 1;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      background: var(--clr-gray-50);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-body { min-width: 0; }
    .card-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--clr-dark);
      line-height: 1;
    }
    .card-label {
      font-size: .73rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .07em;
      color: var(--clr-text-muted);
      margin-top: .35rem;
    }
    .card-sub {
      font-size: .75rem;
      color: var(--clr-text-muted);
      margin-top: .2rem;
    }
  `],
})
export class StatCardComponent {
  @Input() label    = '';
  @Input() value:   number = 0;
  @Input() icon     = '📊';
  @Input() accent:  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' = 'primary';
  @Input() sublabel = '';
}
