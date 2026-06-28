import {
  Component, Input, Output, EventEmitter,
  signal, computed, ChangeDetectionStrategy,
} from '@angular/core';

type StarType = { n: number; fill: number };

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  @Input() set rating(v: number) { this._rating.set(v ?? 0); }
  @Input() mode: 'display' | 'input' = 'display';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() count = 0;
  @Input() muted = false;
  @Output() ratingChange = new EventEmitter<number>();

  _rating      = signal(0);
  _hoverRating = signal(0);

  /** Effective rating — hovered value takes priority in input mode */
  private activeRating = computed(() =>
    this.mode === 'input' && this._hoverRating() > 0
      ? this._hoverRating()
      : this._rating()
  );

  /** Per-star fill percentage (0–100) */
  stars = computed((): StarType[] => {
    const val = this.activeRating();
    return [1, 2, 3, 4, 5].map(n => {
      const diff = val - (n - 1);
      if (diff >= 1) return { n, fill: 100 };
      if (diff >  0) return { n, fill: Math.round(diff * 100) };
      return              { n, fill: 0 };
    });
  });

  displayRating = computed(() => this._rating().toFixed(1));

  hover(n: number): void {
    if (this.mode !== 'input') return;
    this._hoverRating.set(n);
  }

  leave(): void {
    if (this.mode !== 'input') return;
    this._hoverRating.set(0);
  }

  select(n: number): void {
    if (this.mode !== 'input') return;
    this._rating.set(n);
    this.ratingChange.emit(n);
  }
}
