import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, HostListener, Inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Resource } from '../../../../core/models';
import { ResourceDetailPanelComponent } from '../resource-detail-panel/resource-detail-panel.component';

@Component({
  selector: 'app-resource-detail-modal',
  standalone: true,
  imports: [ResourceDetailPanelComponent],
  templateUrl: './resource-detail-modal.component.html',
  styleUrls: ['./resource-detail-modal.component.scss'],
})
export class ResourceDetailModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: Resource;
  @Input() purchased = false;

  @Output() closed = new EventEmitter<void>();
  @Output() open   = new EventEmitter<Resource>();

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void    { this.doc.body.style.overflow = 'hidden'; }
  ngOnDestroy(): void { this.doc.body.style.overflow = ''; }

  @HostListener('keydown.escape')
  onEscape(): void { this.close(); }

  close(): void { this.closed.emit(); }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement) === e.currentTarget) this.close();
  }

  // ── Header badge helpers ─────────────────────────────────────────────────────

  get typeLabel(): string {
    return { PDF: 'PDF', MULTIPLE_CHOICE: 'Quiz', SHORT_ANSWER: 'Flashcards', BUNDLE: 'Bundle' }[this.resource.type] ?? this.resource.type;
  }

  get typeColorClass(): string {
    return { PDF: 'type-pdf', MULTIPLE_CHOICE: 'type-mcq', SHORT_ANSWER: 'type-sa', BUNDLE: 'type-bundle' }[this.resource.type] ?? '';
  }

  get accessLabel(): string {
    if (!this.resource.isPaid) return 'Free';
    return this.purchased ? 'Purchased' : 'Paid';
  }

  get accessClass(): string {
    if (!this.resource.isPaid) return 'access-badge--free';
    return this.purchased ? 'access-badge--owned' : 'access-badge--paid';
  }

  // ── CTA label helpers ────────────────────────────────────────────────────────

  get isBundle(): boolean { return this.resource.type === 'BUNDLE'; }

  get primaryLabel(): string {
    const r = this.resource;
    if (!r.isPaid)     return 'Start Learning';
    if (this.isBundle) return this.purchased ? 'Open Bundle'  : 'Preview Bundle';
    return this.purchased ? 'Start Course' : 'Preview';
  }

  /** Unlock CTA — only shown for paid, not-yet-purchased resources. */
  get secondaryLabel(): string | null {
    if (!this.resource.isPaid || this.purchased) return null;
    return this.isBundle ? 'Unlock Bundle' : 'Unlock Resource';
  }

  get showPrice(): boolean {
    return this.resource.isPaid && !this.purchased;
  }

  get salePrice(): string | null {
    if (!this.showPrice) return null;
    const sale = this.resource.pricing?.salePrice ?? this.resource.price ?? 0;
    return `$${sale.toFixed(2)}`;
  }

  get oldPrice(): string | null {
    if (!this.showPrice) return null;
    const p    = this.resource.pricing;
    const sale = p?.salePrice ?? this.resource.price ?? 0;
    if (!p?.oldPrice || p.oldPrice <= sale) return null;
    return `$${p.oldPrice.toFixed(2)}`;
  }

  get discountPct(): number | null {
    const pct = this.resource.pricing?.discountPercent;
    return pct && pct > 0 ? Math.round(pct) : null;
  }
}
