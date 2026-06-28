import { Component, computed, input } from '@angular/core';

/**
 * Reusable progress bar — visual track only, no text.
 * Callers are responsible for displaying the percentage label.
 *
 * Usage:
 *   <app-progress-bar [pct]="35" />
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div
      class="pb-track"
      role="progressbar"
      [attr.aria-valuenow]="safe()"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="pb-fill"
        [class.pb-fill--done]="safe() >= 100"
        [style.width.%]="safe()"
      ></div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .pb-track {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
    }

    .pb-fill {
      width: 0;
      height: 100%;
      background: #2563eb;
      transition: width .4s ease;
    }
    .pb-fill--done { background: #10b981; }
  `],
})
export class ProgressBarComponent {
  pct  = input<number>(0);
  safe = computed(() => Math.round(Math.min(100, Math.max(0, Number(this.pct()) || 0))));
}
