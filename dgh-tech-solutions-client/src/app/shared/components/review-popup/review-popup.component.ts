import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, HostListener,
  Inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-review-popup',
  standalone: true,
  imports: [FormsModule, StarRatingComponent],
  templateUrl: './review-popup.component.html',
  styleUrls: ['./review-popup.component.scss'],
})
export class ReviewPopupComponent implements OnInit, OnDestroy {
  @Input() resourceId!: string;
  @Input() resourceTitle = '';
  @Output() submitted = new EventEmitter<Review>();
  @Output() closed    = new EventEmitter<void>();

  selectedRating = signal(0);
  comment        = signal('');
  submitting     = signal(false);
  errorMsg       = signal('');
  successMsg     = signal('');

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private reviewSvc: ReviewService,
  ) {}

  ngOnInit(): void {
    this.doc.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement) === e.currentTarget) this.close();
  }

  close(): void {
    this.closed.emit();
  }

  onRatingChange(n: number): void {
    this.selectedRating.set(n);
  }

  ratingLabel(): string {
    const labels: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };
    return labels[this.selectedRating()] ?? '';
  }

  onCommentInput(e: Event): void {
    this.comment.set((e.target as HTMLTextAreaElement).value);
  }

  submit(): void {
    if (this.selectedRating() < 1) {
      this.errorMsg.set('Please select a star rating before submitting.');
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    this.reviewSvc.createReview(this.resourceId, {
      rating:  this.selectedRating(),
      comment: this.comment().trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.successMsg.set('Thank you for your review!');
        this.submitting.set(false);
        setTimeout(() => {
          this.submitted.emit(res.data!);
        }, 1200);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMsg.set(err?.error?.message ?? 'Failed to submit review. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
