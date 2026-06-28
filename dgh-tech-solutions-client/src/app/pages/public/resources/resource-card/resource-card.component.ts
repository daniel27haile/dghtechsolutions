import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { Resource } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [StarRatingComponent],
  templateUrl: './resource-card.component.html',
  styleUrls: ['./resource-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCardComponent {
  private toastSvc = inject(ToastService);

  @Input({ required: true }) resource!: Resource;
  @Input() selected        = false;
  @Input() purchased       = false;
  @Input() saved           = false;
  /** Pass from parent when per-card progress is available (optional). */
  @Input() progressPct     = 0;
  @Input() progressStatus: 'not_started' | 'in_progress' | 'completed' | null = null;

  /** Emitted when user wants to see this resource's details (card body click / View Details). */
  @Output() viewDetails       = new EventEmitter<void>();

  /** Emitted when user clicks the primary CTA (Buy / Open). */
  @Output() primaryCta        = new EventEmitter<void>();

  /** Emitted when user clicks "Add to Cart" on a paid, unpurchased resource. */
  @Output() addToCart         = new EventEmitter<void>();

  /** Emitted when user saves a free resource to their library. */
  @Output() saveToLibrary     = new EventEmitter<void>();

  /** Emitted when user removes a free resource from their library. */
  @Output() removeFromLibrary = new EventEmitter<void>();

  get hasRating(): boolean {
    return (this.resource.reviewCount ?? 0) > 0;
  }

  get contentStat(): string {
    const r = this.resource;
    if (!r.lessonCount) return '';
    const unit =
      r.type === 'MULTIPLE_CHOICE' ? 'questions' :
      r.type === 'SHORT_ANSWER'    ? 'flashcards' :
      r.type === 'PDF'             ? 'pages'      : 'items';
    return `${r.lessonCount} ${unit}`;
  }

  get isBundle(): boolean { return this.resource.type === 'BUNDLE'; }

  get reviewCountText(): string {
    const n = this.resource.reviewCount ?? 0;
    return `${n} ${n === 1 ? 'Review' : 'Reviews'}`;
  }

  typeIconChar(type: string): string {
    return (
      { PDF: '📄', MULTIPLE_CHOICE: '📝', SHORT_ANSWER: '🃏', BUNDLE: '📦' } as Record<string,string>
    )[type] ?? '📚';
  }

  // ── Labels ──────────────────────────────────────────────────────────────────

  get activeLabels(): string[] {
    const l = this.resource.labels;
    if (!l) return [];
    const result: string[] = [];
    if (l.bestSeller)  result.push('Best Seller');
    if (l.hotSelling)  result.push('Hot Selling');
    if (l.isNew)       result.push('New');
    if (l.recommended) result.push('Recommended');
    return result;
  }

  labelChipClass(label: string): string {
    return 'chip--' + label.toLowerCase().replace(/\s+/g, '-');
  }

  // ── Access badge ────────────────────────────────────────────────────────────

  /** Returns null for paid/not-purchased so the price block is used instead. */
  get accessBadgeLabel(): string | null {
    if (this.purchased) return 'Purchased';
    if (!this.resource.isPaid && this.saved) return 'Saved';
    if (!this.resource.isPaid) return 'Free';
    return null;
  }

  get accessBadgeClass(): string {
    if (this.purchased) return 'access-badge--owned';
    if (!this.resource.isPaid && this.saved) return 'access-badge--saved';
    if (!this.resource.isPaid) return 'access-badge--free';
    return '';
  }

  get showSaveButton(): boolean {
    return !this.resource.isPaid && !this.purchased;
  }

  // ── Price display ────────────────────────────────────────────────────────────

  get showPriceBlock(): boolean {
    return this.resource.isPaid && !this.purchased;
  }

  private get currencySymbol(): string {
    const c = this.resource.pricing?.currency ?? 'USD';
    return c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$';
  }

  get displaySalePrice(): string {
    const p     = this.resource.pricing;
    const price = p?.salePrice != null ? p.salePrice : (this.resource.price ?? 0);
    return `${this.currencySymbol}${price.toFixed(2)}`;
  }

  get displayOldPrice(): string | null {
    const p    = this.resource.pricing;
    const sale = p?.salePrice != null ? p.salePrice : (this.resource.price ?? 0);
    if (!p?.oldPrice || p.oldPrice <= sale) return null;
    return `${this.currencySymbol}${p.oldPrice.toFixed(2)}`;
  }

  get displayDiscountPct(): number | null {
    const pct = this.resource.pricing?.discountPercent;
    return pct && pct > 0 ? Math.round(pct) : null;
  }

  // ── CTA labels ──────────────────────────────────────────────────────────────

  /**
   * Only show a footer button when there's meaningful progress context.
   * "Start Learning" duplicates the panel CTA, so it's suppressed here.
   * The card body click opens the preview panel where all actions live.
   */
  get showFooterAction(): boolean {
    return this.progressStatus === 'in_progress' || this.progressStatus === 'completed';
  }

  /** Primary CTA — only shown for free or purchased resources. */
  get primaryLabel(): string {
    if (this.progressStatus === 'completed') return 'Review Again';
    if (this.progressStatus === 'in_progress' && this.progressPct > 0) return 'Continue';
    return 'Start Learning';
  }

  /** No secondary button on cards — unlock/purchase actions live in the preview panel. */
  get secondaryLabel(): string | null { return null; }

  get secondaryFirst(): boolean { return false; }

  // ── Share ────────────────────────────────────────────────────────────────────

  shareResource(event: Event): void {
    event.stopPropagation();
    const url  = `${window.location.origin}/resources/${this.resource._id}`;
    const data = { title: this.resource.title, url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(data).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(
        () => this.toastSvc.show('Link copied to clipboard!'),
        () => this.toastSvc.show('Could not copy link.', 'error'),
      );
    }
  }

  // ── Text helpers ─────────────────────────────────────────────────────────────

  cleanDescription(text: string): string {
    if (!text) return '';
    const t = text.trim();
    const words = t.split(/\s+/);
    if (words.length < 4) return t;
    outer: for (let n = 1; n <= Math.floor(words.length / 2); n++) {
      if (words.length % n !== 0) continue;
      for (let i = n; i < words.length; i++) {
        if (words[i].toLowerCase() !== words[i % n].toLowerCase()) continue outer;
      }
      return words.slice(0, n).join(' ');
    }
    return t;
  }

  // ── Display helpers ─────────────────────────────────────────────────────────

  typePill(type: string): string {
    return {
      PDF:             'PDF',
      MULTIPLE_CHOICE: 'Quiz',
      SHORT_ANSWER:    'Flashcards',
      BUNDLE:          'Bundle',
    }[type] ?? type;
  }

  typeColorClass(type: string): string {
    return {
      PDF:             'type-pdf',
      MULTIPLE_CHOICE: 'type-mcq',
      SHORT_ANSWER:    'type-sa',
      BUNDLE:          'type-bundle',
    }[type] ?? '';
  }
}
