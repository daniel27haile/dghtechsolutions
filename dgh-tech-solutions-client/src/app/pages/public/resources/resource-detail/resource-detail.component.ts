import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ResourceService } from '../../../../core/services/resource.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { UserAuthService } from '../../../../core/services/user-auth.service';
import { ReviewService } from '../../../../core/services/review.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { ToastService }    from '../../../../core/services/toast.service';
import { CartService }     from '../../../../core/services/cart.service';
import { Resource, McqQuestion, ShortAnswerCard, Review, CourseProgress } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { ReviewPopupComponent } from '../../../../shared/components/review-popup/review-popup.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';

type AnswerState = { selected: string | null; revealed: boolean };

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, StarRatingComponent, ReviewPopupComponent, ProgressBarComponent],
  templateUrl: './resource-detail.component.html',
  styleUrls: ['./resource-detail.component.scss'],
})
export class ResourceDetailComponent implements OnInit, OnDestroy {
  resource       = signal<Resource | null>(null);
  questions      = signal<McqQuestion[]>([]);
  cards          = signal<ShortAnswerCard[]>([]);
  loading        = signal(true);
  errorMsg       = signal('');

  // ── MCQ state ──────────────────────────────────────────────────────────────
  currentQIndex     = signal(0);
  answerStates      = signal<AnswerState[]>([]);
  showExplanation   = signal(false);
  explanationText   = signal('');

  // ── Flashcard state ────────────────────────────────────────────────────────
  currentCardIndex  = signal(0);
  cardFlipped       = signal(false);

  // ── Shuffle mode ───────────────────────────────────────────────────────────
  questionMode = signal<'normal' | 'shuffle'>('normal');

  // ── Phase state ────────────────────────────────────────────────────────────
  showPhaseComplete = signal(false);

  // ── Access / payment state ─────────────────────────────────────────────────
  requiresPurchase  = signal(false);
  hasAccess         = signal(false);
  checkingOut       = signal(false);
  checkoutError     = signal('');
  savedToLibrary    = signal(false);
  savingToLibrary   = signal(false);
  isPreviewContent  = signal(false);

  // ── Review state ──────────────────────────────────────────────────────────
  reviews           = signal<Review[]>([]);
  reviewsLoading    = signal(false);
  avgRating         = signal(0);
  reviewCount       = signal(0);
  showReviewPopup   = signal(false);
  hasReviewed       = signal(false);

  // ── Progress state ─────────────────────────────────────────────────────────
  courseProgress       = signal<CourseProgress | null>(null);
  progressLoaded       = signal(false);
  /**
   * Controls which top-level view is visible:
   *  'off'      → intro/details screen  (default)
   *  'learning' → question / flashcard viewer
   *  'review'   → question viewer in read-only review mode (post-completion)
   */
  learningMode         = signal<'off' | 'learning' | 'review'>('off');
  showStartOverConfirm = signal(false);

  // ── Review engagement constants ─────────────────────────────────────────────
  private readonly REVIEW_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  private readonly PDF_ENGAGEMENT_MS  = 90_000;
  private _pdfReviewTimer?: ReturnType<typeof setTimeout>;

  // ── Computed helpers ───────────────────────────────────────────────────────
  currentQuestion = computed((): McqQuestion | undefined => this.questions()[this.currentQIndex()]);
  currentCard     = computed((): ShortAnswerCard | undefined => this.cards()[this.currentCardIndex()]);
  currentAnswer   = computed((): AnswerState => this.answerStates()[this.currentQIndex()] ?? { selected: null, revealed: false });

  progress = computed(() => {
    const r = this.resource();
    if (!r) return '';
    if (this.isPreviewContent() && !this.hasAccess()) return '';
    if (r.type === 'MULTIPLE_CHOICE') {
      if (this.isPhased()) {
        const phase = this.activeQPhase();
        const p1 = this.phase1QCount();
        const p2 = this.questions().length - p1;
        if (phase === 1) return `Phase 1 · Question ${this.currentQIndex() + 1} of ${p1}`;
        return `Phase 2 · Question ${this.currentQIndex() - p1 + 1} of ${p2}`;
      }
      return `Question ${this.currentQIndex() + 1} of ${this.questions().length}`;
    }
    if (r.type === 'SHORT_ANSWER') {
      if (this.isPhased()) {
        const phase = this.activeCardPhase();
        const p1 = this.phase1CardCount();
        const p2 = this.cards().length - p1;
        if (phase === 1) return `Phase 1 · Card ${this.currentCardIndex() + 1} of ${p1}`;
        return `Phase 2 · Card ${this.currentCardIndex() - p1 + 1} of ${p2}`;
      }
      return `Card ${this.currentCardIndex() + 1} of ${this.cards().length}`;
    }
    return '';
  });

  // ── Progress computed ──────────────────────────────────────────────────────
  canTrackProgress = computed(() => {
    const r = this.resource();
    if (!r || !this.userAuth.isLoggedIn()) return false;
    if (r.type === 'BUNDLE') return false;
    return !r.isPaid || this.hasAccess();
  });

  progressPct  = computed(() => this.courseProgress()?.progressPercentage ?? 0);
  hasStarted   = computed(() => {
    const p = this.courseProgress();
    return !!p && p.status !== 'not_started';
  });
  isCompleted  = computed(() => this.courseProgress()?.status === 'completed');

  /** How many MCQ questions have been answered this session (or restored from backend). */
  answeredCount = computed(() => this.answerStates().filter(s => s.revealed).length);

  /**
   * Percentage computed entirely from local UI state — updates instantly on every
   * answer without waiting for the backend round-trip.
   *
   * MCQ  : answered / total * 100
   * Cards: visited  / total * 100  (card is "done" once navigated past)
   * PDF  : falls back to backend value
   */
  localProgressPct = computed(() => {
    const r = this.resource();
    if (!r) return 0;
    if (r.type === 'MULTIPLE_CHOICE') {
      const total = this.questions().length;
      return total ? Math.round((this.answeredCount() / total) * 100) : 0;
    }
    if (r.type === 'SHORT_ANSWER') {
      const total = this.cards().length;
      return total ? Math.round(((this.currentCardIndex() + 1) / total) * 100) : 0;
    }
    return Math.round(Math.min(100, Math.max(0, this.progressPct())));
  });

  /**
   * Best available percentage — the higher of local (live) and backend (persisted).
   * This ensures the displayed % never drops below what the backend has stored and
   * also reflects in-progress answers immediately.
   */
  displayPct = computed(() => Math.max(this.localProgressPct(), this.progressPct()));

  /** Correctly-answered MCQ questions (used on completion/intro screen score). */
  mcqScore = computed(() => {
    const qs = this.questions();
    return this.answerStates().filter(
      (s, i) => s.revealed && s.selected === (qs[i]?.correctAnswer ?? '')
    ).length;
  });

  incorrectCount = computed(() => this.answeredCount() - this.mcqScore());

  /**
   * Which CTA state the intro screen is in:
   *  'not_started' → Start Learning
   *  'in_progress' → Resume Learning + Start Over
   *  'completed'   → Review Again + Start Over
   *  'no_access'   → Preview + Unlock Resource
   */
  ctaState = computed<'not_started' | 'in_progress' | 'completed' | 'no_access'>(() => {
    if (this.requiresPurchase() && !this.hasAccess()) return 'no_access';
    if (this.isCompleted()) return 'completed';
    if (this.hasStarted() && this.displayPct() > 0) return 'in_progress';
    return 'not_started';
  });

  // Show the question/flashcard viewer only when the user has explicitly entered learning mode.
  showLearningContent = computed(() => this.learningMode() !== 'off');

  // True when the user clicked Preview and we have sample content loaded from the backend.
  isPreviewMode = computed(() => this.isPreviewContent() && this.learningMode() !== 'off');

  // ── Phase computed ─────────────────────────────────────────────────────────
  isPhased = computed(() => {
    const lv = this.resource()?.level ?? '';
    return lv === 'Beginner → Intermediate' || lv === 'Intermediate → Advanced';
  });

  phase1QCount    = computed(() => this.questions().filter(q => (q.phase ?? 1) === 1).length);
  phase1CardCount = computed(() => this.cards().filter(c => (c.phase ?? 1) === 1).length);

  activeQPhase    = computed(() => this.isPhased() && this.currentQIndex() >= this.phase1QCount() ? 2 : 1);
  activeCardPhase = computed(() => this.isPhased() && this.currentCardIndex() >= this.phase1CardCount() ? 2 : 1);

  phaseLabel1 = computed(() => {
    const lv = this.resource()?.level ?? '';
    if (lv === 'Beginner → Intermediate') return 'Beginner';
    if (lv === 'Intermediate → Advanced') return 'Intermediate';
    return 'Phase 1';
  });
  phaseLabel2 = computed(() => {
    const lv = this.resource()?.level ?? '';
    if (lv === 'Beginner → Intermediate') return 'Intermediate';
    if (lv === 'Intermediate → Advanced') return 'Advanced';
    return 'Phase 2';
  });

  private toastSvc = inject(ToastService);
  cartSvc          = inject(CartService);

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private resourceSvc: ResourceService,
    private paymentSvc:  PaymentService,
    public  userAuth:    UserAuthService,
    private reviewSvc:   ReviewService,
    private progressSvc: ProgressService,
  ) {}

  ngOnDestroy(): void {
    clearTimeout(this._pdfReviewTimer);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    const state = (history.state as { resource?: Resource }).resource;
    if (state?._id === id) {
      this.resource.set(state);
      this.loadContent(id);
    } else {
      this.resourceSvc.getById(id).subscribe({
        next:  (r) => { this.resource.set(r.data ?? null); this.loadContent(id); },
        error: ()  => { this.errorMsg.set('Resource not found.'); this.loading.set(false); },
      });
    }
  }

  private loadContent(id: string): void {
    const r = this.resource();
    if (!r) { this.loading.set(false); return; }

    this.loadReviews(id);

    if (r.averageRating !== undefined) this.avgRating.set(r.averageRating);
    if (r.reviewCount   !== undefined) this.reviewCount.set(r.reviewCount);

    if (r.isPaid && this.userAuth.isLoggedIn()) {
      this.paymentSvc.checkAccess(id).subscribe({
        next: (res) => {
          const access = !!res.data?.hasAccess;
          if (access) this.hasAccess.set(true);
          this.fetchContent(id, r.type);
          if (r.type === 'PDF' && access) {
            this.schedulePdfReviewPrompt(id);
          }
        },
        error: () => this.fetchContent(id, r.type),
      });
    } else {
      // For free resources, check if the user has saved it to their library
      if (!r.isPaid && this.userAuth.isLoggedIn()) {
        this.paymentSvc.getMyLibrary().subscribe({
          next: (res) => {
            const savedIds = new Set((res.data?.savedFree ?? []).map(i => i.resource._id!).filter(Boolean));
            this.savedToLibrary.set(savedIds.has(id));
          },
          error: () => {},
        });
      }
      this.fetchContent(id, r.type);
    }
  }

  private loadReviews(id: string): void {
    this.reviewsLoading.set(true);
    this.reviewSvc.getReviews(id).subscribe({
      next:  (res) => { this.reviews.set(res.data ?? []); this.reviewsLoading.set(false); },
      error: ()    => { this.reviewsLoading.set(false); },
    });
  }

  private triggerReviewCheck(id: string): void {
    if (!this.userAuth.isLoggedIn()) return;
    if (this.hasReviewed()) return;
    if (this.isReviewDismissedRecently(id)) return;

    this.reviewSvc.getMyReview(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.hasReviewed.set(true);
        } else {
          setTimeout(() => this.showReviewPopup.set(true), 1500);
        }
      },
      error: () => { /* silently ignore */ },
    });
  }

  private isReviewDismissedRecently(id: string): boolean {
    const stored = localStorage.getItem(`review-dismissed-${id}`);
    if (!stored) return false;
    return Date.now() - parseInt(stored, 10) < this.REVIEW_COOLDOWN_MS;
  }

  private schedulePdfReviewPrompt(id: string): void {
    clearTimeout(this._pdfReviewTimer);
    this._pdfReviewTimer = setTimeout(() => {
      this.triggerReviewCheck(id);
    }, this.PDF_ENGAGEMENT_MS);
  }

  private fetchContent(id: string, type: string): void {
    if (type === 'MULTIPLE_CHOICE') {
      this.resourceSvc.getQuestions(id).subscribe({
        next: (res) => {
          const qs = res.data ?? [];
          this.questions.set(qs);
          this.answerStates.set(qs.map(() => ({ selected: null, revealed: false })));
          if (res.isPreview) {
            this.isPreviewContent.set(true);
            this.requiresPurchase.set(true);
          }
          this.loading.set(false);
          if (this.canTrackProgress()) this.loadProgress(id);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 402) this.requiresPurchase.set(true);
          this.loading.set(false);
        },
      });
    } else if (type === 'SHORT_ANSWER') {
      this.resourceSvc.getCards(id).subscribe({
        next: (res) => {
          this.cards.set(res.data ?? []);
          if (res.isPreview) {
            this.isPreviewContent.set(true);
            this.requiresPurchase.set(true);
          }
          this.loading.set(false);
          if (this.canTrackProgress()) this.loadProgress(id);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 402) this.requiresPurchase.set(true);
          this.loading.set(false);
        },
      });
    } else {
      if (this.resource()?.isPaid && !this.hasAccess()) {
        this.requiresPurchase.set(true);
      }
      this.loading.set(false);
      if (type === 'PDF' && !this.resource()?.isPaid) {
        this.schedulePdfReviewPrompt(id);
      }
      // Load progress for PDF (not BUNDLE)
      if (type === 'PDF' && this.canTrackProgress()) this.loadProgress(id);
    }
  }

  // ── Progress methods ───────────────────────────────────────────────────────

  private localKey(resourceId: string): string {
    const uid = this.userAuth.currentUser()?._id ?? 'guest';
    return `learningProgress:${uid}:${resourceId}`;
  }

  private saveLocalProgress(resourceId: string, states: AnswerState[]): void {
    try {
      const qs = this.questions();
      const selectedAnswers: Record<string, string> = {};
      qs.forEach((q, i) => {
        const s = states[i];
        if (s?.revealed && s.selected) selectedAnswers[String(q._id)] = s.selected;
      });
      const data = {
        currentQuestionIndex: this.currentQIndex(),
        answeredQuestions: qs.filter((_, i) => states[i]?.revealed).map(q => String(q._id)),
        selectedAnswers,
        score: states.filter((s, i) => s.revealed && s.selected === (qs[i]?.correctAnswer ?? '')).length,
        progressPercentage: this.localProgressPct(),
        completed: states.every(s => s.revealed),
        startedAt: this.courseProgress()?.startedAt ?? new Date().toISOString(),
        completedAt: states.every(s => s.revealed) ? new Date().toISOString() : undefined,
        lastAccessedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.localKey(resourceId), JSON.stringify(data));
    } catch { /* storage quota exceeded */ }
  }

  private restoreFromLocal(resourceId: string): void {
    try {
      const raw = localStorage.getItem(this.localKey(resourceId));
      if (raw) {
        const p = JSON.parse(raw) as {
          selectedAnswers?: Record<string, string>;
          answeredQuestions?: string[];
        };
        const qs = this.questions();
        const answered = new Set(p.answeredQuestions ?? []);
        const sel = p.selectedAnswers ?? {};
        if (answered.size > 0) {
          this.answerStates.set(
            qs.map(q => {
              const qId = String(q._id);
              return answered.has(qId)
                ? { selected: sel[qId] ?? q.correctAnswer ?? null, revealed: true }
                : { selected: null, revealed: false };
            })
          );
          const firstUnanswered = qs.findIndex(q => !answered.has(String(q._id)));
          this.currentQIndex.set(firstUnanswered >= 0 ? firstUnanswered : qs.length - 1);
        }
      }
    } catch { /* ignore */ }
    this.progressLoaded.set(true);
  }

  private loadProgress(id: string): void {
    this.progressSvc.getProgress(id).subscribe({
      next: (res) => {
        const p = res.data ?? null;
        this.courseProgress.set(p);
        this.progressLoaded.set(true);
        // Restore last position for MCQ / flashcards
        if (p && p.progressPercentage > 0) {
          this.restorePosition(p);
        }
        const r = this.resource();
        if (r?.type === 'PDF' && this.hasAccess() && (!p || p.status === 'not_started')) {
          // PDF: auto-mark started after an engagement delay (no explicit Start button for PDF)
          setTimeout(() => this.initPdfProgress(id), 2000);
        }
      },
      error: () => {
        this.restoreFromLocal(id);
      },
    });
  }

  private restorePosition(p: CourseProgress): void {
    const r = this.resource();
    if (!r) return;

    if (r.type === 'MULTIPLE_CHOICE') {
      const completed = new Set((p.completedItemIds ?? []).map(String));

      // Load which choice the user actually selected from localStorage
      const id = this.route.snapshot.paramMap.get('id')!;
      let savedSelections: Record<string, string> = {};
      try {
        const raw = localStorage.getItem(this.localKey(id));
        if (raw) {
          const saved = JSON.parse(raw) as { selectedAnswers?: Record<string, string> };
          savedSelections = saved.selectedAnswers ?? {};
        }
      } catch { /* ignore */ }

      if (completed.size > 0) {
        this.answerStates.set(
          this.questions().map((q) => {
            const qId = String(q._id);
            return completed.has(qId)
              ? { selected: savedSelections[qId] ?? q.correctAnswer ?? null, revealed: true }
              : { selected: null, revealed: false };
          })
        );
      }

      // Resume at the first UNANSWERED question, not the last visited
      const firstUnanswered = this.questions().findIndex(q => !completed.has(String(q._id)));
      this.currentQIndex.set(firstUnanswered >= 0 ? firstUnanswered : this.questions().length - 1);
    } else if (r.type === 'SHORT_ANSWER') {
      if (p.currentItemId) {
        const idx = this.cards().findIndex((c) => String(c._id) === String(p.currentItemId));
        if (idx >= 0) this.currentCardIndex.set(idx);
      }
    }
  }

  private syncMcqProgress(id: string, states: AnswerState[]): void {
    if (!this.canTrackProgress()) return;
    const qs = this.questions();
    // Use string conversion to avoid ObjectId/string mismatch
    const completedItemIds = qs
      .map((q, i) => (states[i]?.revealed ? String(q._id ?? '') : ''))
      .filter(Boolean);
    const currentItemId = qs[this.currentQIndex()]?._id ?? null;
    this.progressSvc.updateProgress(id, { completedItemIds, currentItemId })
      .subscribe({
        next: (res) => {
          this.courseProgress.set(res.data ?? null);
          // When all questions answered, transition to the intro completion screen
          if (res.data?.status === 'completed' && this.learningMode() === 'learning') {
            this.learningMode.set('off');
          }
        },
        error: () => {},
      });
  }

  private syncCardProgress(id: string): void {
    if (!this.canTrackProgress()) return;
    const cs  = this.cards();
    const idx = this.currentCardIndex();
    // Mark all cards navigated to (including current) as visited
    const completedItemIds = cs.slice(0, idx + 1).map((c) => String(c._id ?? '')).filter(Boolean);
    const currentItemId    = cs[idx]?._id ?? null;
    // Backend computes progressPercentage and status from completedItemIds count
    this.progressSvc.updateProgress(id, { completedItemIds, currentItemId })
      .subscribe({ next: (res) => this.courseProgress.set(res.data ?? null), error: () => {} });
  }

  /** Mark ALL flashcards complete — used by the "All Done" button on the last card.
   *  This handles both 1-card courses (where nextCard() never fires) and confirms
   *  completion for multi-card courses. */
  markAllDone(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    if (!this.canTrackProgress()) return;
    const cs = this.cards();
    const completedItemIds = cs.map((c) => String(c._id ?? '')).filter(Boolean);
    const currentItemId    = cs[cs.length - 1]?._id ?? null;
    this.progressSvc.updateProgress(id, { completedItemIds, currentItemId })
      .subscribe({
        next: (res) => {
          this.courseProgress.set(res.data ?? null);
          if (res.data?.status === 'completed') {
            this.learningMode.set('off');
          }
        },
        error: () => {},
      });
  }

  private initPdfProgress(id: string): void {
    if (!this.canTrackProgress()) return;
    const existing = this.courseProgress();
    if (existing && existing.status !== 'not_started') return; // already started or done
    this.progressSvc
      .updateProgress(id, { currentItemId: 'pdf', progressPercentage: 10, status: 'in_progress' })
      .subscribe({ next: (res) => this.courseProgress.set(res.data ?? null), error: () => {} });
  }

  /** Mark PDF as fully read. */
  markPdfComplete(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.progressSvc
      .updateProgress(id, { currentItemId: 'pdf', progressPercentage: 100, status: 'completed' })
      .subscribe({ next: (res) => this.courseProgress.set(res.data ?? null), error: () => {} });
  }

  // ── Intro → Learning navigation ────────────────────────────────────────────

  /** Case A: never started → begin at Q1 and persist in_progress. */
  startLearning(): void {
    this.showPhaseComplete.set(false);

    if (this.questionMode() === 'shuffle') {
      const type = this.resource()?.type;
      if (type === 'MULTIPLE_CHOICE') {
        if (this.isPhased()) {
          // Shuffle within each phase separately so phase ordering is preserved
          const p1 = [...this.questions().filter(q => (q.phase ?? 1) === 1)].sort(() => Math.random() - 0.5);
          const p2 = [...this.questions().filter(q => (q.phase ?? 1) === 2)].sort(() => Math.random() - 0.5);
          const shuffled = [...p1, ...p2];
          this.questions.set(shuffled);
          this.answerStates.set(shuffled.map(() => ({ selected: null, revealed: false })));
        } else {
          const shuffled = [...this.questions()].sort(() => Math.random() - 0.5);
          this.questions.set(shuffled);
          this.answerStates.set(shuffled.map(() => ({ selected: null, revealed: false })));
        }
      } else if (type === 'SHORT_ANSWER') {
        if (this.isPhased()) {
          const p1 = [...this.cards().filter(c => (c.phase ?? 1) === 1)].sort(() => Math.random() - 0.5);
          const p2 = [...this.cards().filter(c => (c.phase ?? 1) === 2)].sort(() => Math.random() - 0.5);
          this.cards.set([...p1, ...p2]);
        } else {
          this.cards.set([...this.cards()].sort(() => Math.random() - 0.5));
        }
      }
    }

    this.learningMode.set('learning');
    this.currentQIndex.set(0);
    this.currentCardIndex.set(0);
    this.cardFlipped.set(false);

    if (!this.canTrackProgress()) return;
    const id   = this.route.snapshot.paramMap.get('id')!;
    const type = this.resource()!.type;
    const currentItemId = type === 'MULTIPLE_CHOICE'
      ? (this.questions()[0]?._id ?? null)
      : (this.cards()[0]?._id ?? null);
    this.progressSvc
      .updateProgress(id, { completedItemIds: [], currentItemId, status: 'in_progress' })
      .subscribe({ next: (res) => this.courseProgress.set(res.data ?? null), error: () => {} });
  }

  /** Case B: in-progress → restore saved position without resetting anything. */
  resumeLearning(): void {
    this.learningMode.set('learning');
    const p = this.courseProgress();
    if (p) this.restorePosition(p);
  }

  /** Case C: completed → let user review answers; does NOT erase progress. */
  reviewAgain(): void {
    this.learningMode.set('review');
    this.currentQIndex.set(0);
    this.currentCardIndex.set(0);
    this.cardFlipped.set(false);
  }

  /** Return to the intro/details screen from the learning screen. */
  backToIntro(): void {
    this.learningMode.set('off');
  }

  /** Open the Start Over confirmation modal. */
  confirmStartOver(): void {
    this.showStartOverConfirm.set(true);
  }

  /** Cancel the confirmation modal. */
  cancelStartOver(): void {
    this.showStartOverConfirm.set(false);
  }

  /** Confirmed hard-reset: wipe all progress, return to intro. */
  resetProgress(): void {
    this.learningMode.set('off');
    this.showStartOverConfirm.set(false);
    this.showPhaseComplete.set(false);
    this.currentQIndex.set(0);
    this.currentCardIndex.set(0);
    this.answerStates.set(this.questions().map(() => ({ selected: null, revealed: false })));
    this.cardFlipped.set(false);

    const id = this.route.snapshot.paramMap.get('id')!;
    try { localStorage.removeItem(this.localKey(id)); } catch { /* ignore */ }

    this.progressSvc.resetProgress(id).subscribe({
      next: (res) => this.courseProgress.set(res.data ?? null),
      error: () => {},
    });
  }

  /**
   * Remove text duplicated by data-entry errors (handles 2× and 3× etc.), e.g.
   * "AWS Solutions Architect AWS Solutions Architect" → "AWS Solutions Architect"
   */
  normalizeText(text: string): string {
    return this.cleanDescription(text);
  }

  /**
   * Remove N-times repeated text, e.g.
   * "AWS Solutions Architect AWS Solutions Architect AWS Solutions Architect"
   * → "AWS Solutions Architect"
   * Only collapses text that is a perfect word-level repetition; all other text is untouched.
   */
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

  // ── MCQ methods ────────────────────────────────────────────────────────────
  selectAnswer(choice: string): void {
    const current = this.answerStates()[this.currentQIndex()];
    if (current.revealed) return;
    const updated = [...this.answerStates()];
    updated[this.currentQIndex()] = { selected: choice, revealed: true };
    this.answerStates.set(updated);

    const id = this.route.snapshot.paramMap.get('id')!;
    this.saveLocalProgress(id, updated);
    this.syncMcqProgress(id, updated);

    if (this.isLastQuestion()) {
      this.triggerReviewCheck(id);
    }
  }

  choiceClass(choice: string): string {
    const state = this.currentAnswer();
    const q     = this.currentQuestion();
    if (!state.revealed) return state.selected === choice ? 'choice--selected' : '';
    if (choice === (q?.correctAnswer ?? ''))  return 'choice--correct';
    if (choice === state.selected)            return 'choice--wrong';
    return '';
  }

  openExplanation(): void {
    const q = this.currentQuestion();
    this.explanationText.set(q?.explanation || 'No explanation provided.');
    this.showExplanation.set(true);
  }

  closeExplanation(): void { this.showExplanation.set(false); }

  prevQuestion(): void {
    if (this.currentQIndex() > 0) {
      this.currentQIndex.update(i => i - 1);
    }
  }

  nextQuestion(): void {
    const idx = this.currentQIndex();
    const p1count = this.phase1QCount();
    // Phase break: just finished last phase-1 question
    if (this.isPhased() && idx === p1count - 1 && this.questions().length > p1count) {
      this.showPhaseComplete.set(true);
      return;
    }
    if (idx < this.questions().length - 1) {
      this.currentQIndex.update(i => i + 1);
    }
  }

  continueToPhase2(): void {
    this.showPhaseComplete.set(false);
    const p1count = this.phase1QCount();
    if (this.resource()?.type === 'MULTIPLE_CHOICE') {
      this.currentQIndex.set(p1count);
    } else {
      this.currentCardIndex.set(this.phase1CardCount());
      this.cardFlipped.set(false);
    }
  }

  isLastQuestion  = computed(() => this.currentQIndex() === this.questions().length - 1);
  isFirstQuestion = computed(() => this.currentQIndex() === 0);
  mcqComplete     = computed(() => this.answerStates().every(s => s.revealed));

  // ── Flashcard methods ──────────────────────────────────────────────────────
  flipCard(): void { this.cardFlipped.update(v => !v); }

  prevCard(): void {
    if (this.currentCardIndex() > 0) {
      this.currentCardIndex.update(i => i - 1);
      this.cardFlipped.set(false);
    }
  }

  nextCard(): void {
    const idx = this.currentCardIndex();
    const p1count = this.phase1CardCount();
    // Phase break: just finished last phase-1 card
    if (this.isPhased() && idx === p1count - 1 && this.cards().length > p1count) {
      this.showPhaseComplete.set(true);
      return;
    }
    if (idx < this.cards().length - 1) {
      this.currentCardIndex.update(i => i + 1);
      this.cardFlipped.set(false);

      const id = this.route.snapshot.paramMap.get('id')!;
      this.syncCardProgress(id);

      if (this.isLastCard()) {
        this.triggerReviewCheck(id);
      }
    }
  }

  isLastCard  = computed(() => this.currentCardIndex() === this.cards().length - 1);
  isFirstCard = computed(() => this.currentCardIndex() === 0);

  // ── Helpers ────────────────────────────────────────────────────────────────
  typeBadge(type: string): string {
    const map: Record<string, string> = {
      PDF: 'PDF Guide', MULTIPLE_CHOICE: 'Multiple Choice', SHORT_ANSWER: 'Flashcards', BUNDLE: 'Bundle',
    };
    return map[type] ?? type;
  }

  getChoice(label: string): string {
    const q = this.currentQuestion();
    if (!q) return '';
    return q.choices[label as 'A' | 'B' | 'C' | 'D'];
  }

  startCheckout(): void {
    const r = this.resource();
    if (!r?._id) return;

    if (!this.userAuth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/resources/${r._id}` } });
      return;
    }

    this.checkingOut.set(true);
    this.checkoutError.set('');
    this.paymentSvc.createCheckoutSession(r._id).subscribe({
      next:  (res) => { if (res.data?.url) window.location.href = res.data.url; },
      error: (e: { error?: { message?: string } }) => {
        this.checkoutError.set(e?.error?.message || 'Checkout failed. Please try again.');
        this.checkingOut.set(false);
      },
    });
  }

  addToCart(): void {
    const r = this.resource();
    if (!r?._id) return;
    this.cartSvc.addItem(r._id).subscribe({
      next: () => {
        this.toastSvc.show(`"${r.title}" added to cart!`);
        this.cartSvc.openDrawer();
      },
      error: (e: { error?: { message?: string } }) => {
        this.toastSvc.show(e?.error?.message || 'Could not add to cart.', 'error');
      },
    });
  }

  saveToLibrary(): void {
    const r = this.resource();
    if (!r?._id || r.isPaid) return;
    if (!this.userAuth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.savingToLibrary.set(true);
    this.paymentSvc.saveResource(r._id).subscribe({
      next: () => {
        this.savedToLibrary.set(true);
        this.savingToLibrary.set(false);
        this.toastSvc.show(`"${r.title}" saved to your library!`);
      },
      error: (e: { error?: { message?: string } }) => {
        this.savingToLibrary.set(false);
        this.toastSvc.show(e?.error?.message || 'Could not save resource.', 'error');
      },
    });
  }

  unsaveFromLibrary(): void {
    const r = this.resource();
    if (!r?._id) return;
    this.savingToLibrary.set(true);
    this.paymentSvc.unsaveResource(r._id).subscribe({
      next: () => {
        this.savedToLibrary.set(false);
        this.savingToLibrary.set(false);
        this.toastSvc.show(`"${r.title}" removed from library.`, 'info');
      },
      error: (e: { error?: { message?: string } }) => {
        this.savingToLibrary.set(false);
        this.toastSvc.show(e?.error?.message || 'Could not remove resource.', 'error');
      },
    });
  }

  shareResource(): void {
    const r = this.resource();
    if (!r?._id) return;
    const url  = `${window.location.origin}/resources/${r._id}`;
    const data = { title: r.title, url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(data).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(
        () => this.toastSvc.show('Link copied to clipboard!'),
        () => this.toastSvc.show('Could not copy link.', 'error'),
      );
    }
  }

  onContextMenu(e: MouseEvent): boolean {
    e.preventDefault();
    return false;
  }

  // ── Review popup handlers ─────────────────────────────────────────────────

  closeReviewPopup(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    localStorage.setItem(`review-dismissed-${id}`, String(Date.now()));
    this.showReviewPopup.set(false);
  }

  onReviewSubmitted(review: Review): void {
    this.showReviewPopup.set(false);
    this.hasReviewed.set(true);

    const id = this.route.snapshot.paramMap.get('id')!;
    const newEntry: Review = {
      ...review,
      userName: this.userAuth.currentUser()?.name ?? 'You',
    };
    this.reviews.update(list => [newEntry, ...list]);

    this.reviewSvc.getReviews(id).subscribe({
      next: (res) => this.reviews.set(res.data ?? []),
      error: () => {},
    });
    this.reviewSvc.getReviewSummary(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.avgRating.set(res.data.averageRating);
          this.reviewCount.set(res.data.count);
        }
      },
      error: () => {},
    });
  }

  formatReviewDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
