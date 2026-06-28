import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResourceService } from '../../../../core/services/resource.service';
import { UploadService }   from '../../../../core/services/upload.service';
import { Resource, McqQuestion, ShortAnswerCard, ResourcePricing, ResourceLabels } from '../../../../core/models';

@Component({
  selector: 'app-resource-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.scss'],
})
export class ResourceFormComponent implements OnInit {
  form!: FormGroup;
  addQForm!: FormGroup;
  editQForm!: FormGroup;
  addCardForm!: FormGroup;
  editCardForm!: FormGroup;

  resourceId  = signal<string | null>(null);
  loading     = signal(false);
  saving      = signal(false);
  errorMsg    = signal('');
  successMsg  = signal('');

  // ── Content (questions / cards) ────────────────────────────────────────────
  questions       = signal<McqQuestion[]>([]);
  cards           = signal<ShortAnswerCard[]>([]);
  loadingContent  = signal(false);
  showAddQ        = signal(false);
  showAddCard     = signal(false);
  editingQId      = signal<string | null>(null);
  editingCardId   = signal<string | null>(null);
  savingContent   = signal(false);
  contentError    = signal('');

  // ── Upload state ───────────────────────────────────────────────────────────
  uploadingThumb  = signal(false);
  uploadingPdf    = signal(false);
  uploadThumbError = signal('');
  uploadPdfError  = signal('');

  readonly categories = [
    'Interview Questions',
    'Certification Questions',
    'Useful Resources',
    'Multiple Choice Practice',
    'Short Answer / Flashcards',
  ] as const;

  readonly types = [
    { value: 'PDF',             label: 'PDF Guide' },
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice (Quiz)' },
    { value: 'SHORT_ANSWER',    label: 'Short Answer / Flashcards' },
    { value: 'BUNDLE',          label: 'Bundle (collection of resources)' },
  ] as const;

  readonly levels = [
    'Beginner → Intermediate',
    'Intermediate → Advanced',
    'All Levels',
  ] as const;

  currentType  = computed(() => this.form?.get('type')?.value as string ?? '');
  get isPhased(): boolean {
    const lv = this.form?.get('level')?.value as string ?? '';
    return lv === 'Beginner → Intermediate' || lv === 'Intermediate → Advanced';
  }
  isEditing   = computed(() => !!this.resourceId());
  showContent = computed(() =>
    this.isEditing() && (this.currentType() === 'MULTIPLE_CHOICE' || this.currentType() === 'SHORT_ANSWER')
  );
  showBundlePicker = computed(() => this.currentType() === 'BUNDLE');

  // ── Bundle resource selection ───────────────────────────────────────────────
  allResources    = signal<Resource[]>([]);
  bundleIncluded  = signal<Set<string>>(new Set());
  loadingResources = signal(false);

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private fb:          FormBuilder,
    private resourceSvc: ResourceService,
    private uploadSvc:   UploadService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.resourceId.set(id);
    this.buildForms();

    if (id) {
      const state = (history.state as { resource?: Resource }).resource;
      if (state?._id === id) {
        this.patchForm(state);
        this.loadContent(id);
        if (state.type === 'BUNDLE') this.loadAllResources();
      } else {
        this.loading.set(true);
        this.resourceSvc.getAdminById(id).subscribe({
          next:  (r) => {
            if (r.data) {
              this.patchForm(r.data);
              this.loadContent(id);
              if (r.data.type === 'BUNDLE') this.loadAllResources();
            }
            this.loading.set(false);
          },
          error: ()  => this.loading.set(false),
        });
      }
    }

    // Watch for type changes to lazy-load resource list for bundle picker
    this.form.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'BUNDLE' && this.allResources().length === 0) {
        this.loadAllResources();
      }
    });

    // Auto-calculate discount when old/sale price changes
    this.form.get('pricingOldPrice')?.valueChanges.subscribe(() => this.autoCalcDiscount());
    this.form.get('pricingSalePrice')?.valueChanges.subscribe(() => this.autoCalcDiscount());
    this.form.get('pricingAutoCalc')?.valueChanges.subscribe(() => this.autoCalcDiscount());
  }

  private autoCalcDiscount(): void {
    if (!this.form.get('pricingAutoCalc')?.value) return;
    const old  = Number(this.form.get('pricingOldPrice')?.value  ?? 0);
    const sale = Number(this.form.get('pricingSalePrice')?.value ?? 0);
    if (old > 0 && old > sale) {
      const pct = Math.round(((old - sale) / old) * 100);
      this.form.get('pricingDiscPct')?.setValue(Math.min(100, pct), { emitEvent: false });
    } else {
      this.form.get('pricingDiscPct')?.setValue(0, { emitEvent: false });
    }
  }

  /** Live preview string shown below the pricing card. */
  get pricingPreview(): string {
    const isFree = this.form.get('pricingIsFree')?.value;
    if (isFree) return 'Free';
    const currency = this.form.get('pricingCurrency')?.value ?? 'USD';
    const sym  = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    const sale = Number(this.form.get('pricingSalePrice')?.value ?? 0);
    const old  = Number(this.form.get('pricingOldPrice')?.value  ?? 0);
    const pct  = Number(this.form.get('pricingDiscPct')?.value   ?? 0);
    let preview = `${sym}${sale.toFixed(2)}`;
    if (old > sale) preview = `${sym}${old.toFixed(2)} → ${preview}`;
    if (pct > 0)    preview += `  (${pct}% OFF)`;
    return preview;
  }

  private buildForms(): void {
    this.form = this.fb.group({
      title:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description:      ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      category:         ['', Validators.required],
      type:             ['', Validators.required],
      thumbnailUrl:     [''],
      pdfUrl:           [''],
      previewPageLimit: [2, [Validators.min(0)]],
      isPublished:      [false],
      isFeatured:       [false],
      tags:             [''],
      displayOrder:     [0, [Validators.min(0), Validators.max(999)]],
      level:            ['All Levels'],
      // ── Pricing ──────────────────────────────────────────────────────────
      pricingIsFree:    [false],
      pricingCurrency:  ['USD'],
      pricingOldPrice:  [0, [Validators.min(0)]],
      pricingSalePrice: [0, [Validators.min(0)]],
      pricingDiscPct:   [0, [Validators.min(0), Validators.max(100)]],
      pricingAutoCalc:  [true],
      // ── Labels ───────────────────────────────────────────────────────────
      labelBestSeller:  [false],
      labelHotSelling:  [false],
      labelIsNew:       [false],
      labelRecommended: [false],
    });

    this.addQForm = this.fb.group({
      question:      ['', Validators.required],
      choiceA:       ['', Validators.required],
      choiceB:       ['', Validators.required],
      choiceC:       ['', Validators.required],
      choiceD:       ['', Validators.required],
      correctAnswer: ['A', Validators.required],
      explanation:   [''],
      order:         [0],
      phase:         [1],
    });

    this.editQForm = this.fb.group({
      question:      ['', Validators.required],
      choiceA:       ['', Validators.required],
      choiceB:       ['', Validators.required],
      choiceC:       ['', Validators.required],
      choiceD:       ['', Validators.required],
      correctAnswer: ['A', Validators.required],
      explanation:   [''],
      order:         [0],
      phase:         [1],
    });

    this.addCardForm = this.fb.group({
      question:    ['', Validators.required],
      answer:      ['', Validators.required],
      explanation: [''],
      order:       [0],
      phase:       [1],
    });

    this.editCardForm = this.fb.group({
      question:    ['', Validators.required],
      answer:      ['', Validators.required],
      explanation: [''],
      order:       [0],
      phase:       [1],
    });
  }

  private patchForm(r: Resource): void {
    const p = r.pricing;
    const l = r.labels;
    this.form.patchValue({
      title:            r.title,
      description:      r.description,
      category:         r.category,
      type:             r.type,
      thumbnailUrl:     r.thumbnailUrl     ?? '',
      pdfUrl:           r.pdfUrl           ?? '',
      previewPageLimit: r.previewPageLimit ?? 2,
      isPublished:      r.isPublished,
      isFeatured:       r.isFeatured,
      tags:             r.tags?.join(', ') ?? '',
      displayOrder:     r.displayOrder     ?? 0,
      level:            r.level            ?? 'All Levels',
      // Pricing — fall back to legacy isPaid/price when pricing subdoc absent
      pricingIsFree:    p?.isFree    ?? !r.isPaid,
      pricingCurrency:  p?.currency  ?? 'USD',
      pricingOldPrice:  p?.oldPrice  ?? 0,
      pricingSalePrice: p?.salePrice ?? r.price ?? 0,
      pricingDiscPct:   p?.discountPercent ?? 0,
      pricingAutoCalc:  p?.autoCalculateDiscount ?? true,
      // Labels
      labelBestSeller:  l?.bestSeller  ?? false,
      labelHotSelling:  l?.hotSelling  ?? false,
      labelIsNew:       l?.isNew       ?? false,
      labelRecommended: l?.recommended ?? false,
    });
    if (r.includedResourceIds?.length) {
      this.bundleIncluded.set(new Set(r.includedResourceIds));
    }
  }

  loadAllResources(): void {
    if (this.loadingResources()) return;
    this.loadingResources.set(true);
    this.resourceSvc.getAll().subscribe({
      next:  (r) => {
        // Exclude the current resource from the picker (can't add a bundle to itself)
        const id = this.resourceId();
        this.allResources.set((r.data ?? []).filter(res => res._id !== id && res.type !== 'BUNDLE'));
        this.loadingResources.set(false);
      },
      error: () => this.loadingResources.set(false),
    });
  }

  toggleBundleResource(id: string): void {
    const current = new Set(this.bundleIncluded());
    if (current.has(id)) { current.delete(id); } else { current.add(id); }
    this.bundleIncluded.set(current);
  }

  isBundleSelected(id: string): boolean {
    return this.bundleIncluded().has(id);
  }

  private loadContent(id: string): void {
    const type = this.form.get('type')?.value;
    if (type === 'MULTIPLE_CHOICE') {
      this.loadingContent.set(true);
      this.resourceSvc.getAdminQuestions(id).subscribe({
        next:  (r) => { this.questions.set(r.data ?? []); this.loadingContent.set(false); },
        error: ()  => this.loadingContent.set(false),
      });
    } else if (type === 'SHORT_ANSWER') {
      this.loadingContent.set(true);
      this.resourceSvc.getAdminCards(id).subscribe({
        next:  (r) => { this.cards.set(r.data ?? []); this.loadingContent.set(false); },
        error: ()  => this.loadingContent.set(false),
      });
    }
  }

  // ── Save resource info ─────────────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const v = this.form.value;

    const pricing: ResourcePricing = {
      isFree:                !!v.pricingIsFree,
      currency:              v.pricingCurrency || 'USD',
      oldPrice:              Number(v.pricingOldPrice  ?? 0),
      salePrice:             Number(v.pricingSalePrice ?? 0),
      discountPercent:       Number(v.pricingDiscPct   ?? 0),
      autoCalculateDiscount: !!v.pricingAutoCalc,
    };

    const labels: ResourceLabels = {
      bestSeller:  !!v.labelBestSeller,
      hotSelling:  !!v.labelHotSelling,
      isNew:       !!v.labelIsNew,
      recommended: !!v.labelRecommended,
    };

    const payload: Partial<Resource> = {
      title:               v.title,
      description:         v.description,
      category:            v.category,
      type:                v.type,
      thumbnailUrl:        v.thumbnailUrl,
      pdfUrl:              v.pdfUrl,
      previewPageLimit:    v.previewPageLimit,
      // Legacy fields — kept in sync by backend syncPricingFields()
      isPaid:              !v.pricingIsFree,
      price:               v.pricingIsFree ? 0 : Number(v.pricingSalePrice ?? 0),
      pricing,
      labels,
      isPublished:         v.isPublished,
      isFeatured:          v.isFeatured,
      displayOrder:        v.displayOrder,
      tags:                v.tags ? (v.tags as string).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      includedResourceIds: v.type === 'BUNDLE' ? Array.from(this.bundleIncluded()) : [],
      level:               v.level || 'All Levels',
    };

    const id = this.resourceId();
    const op = id
      ? this.resourceSvc.update(id, payload)
      : this.resourceSvc.create(payload);

    op.subscribe({
      next: (r) => {
        this.saving.set(false);
        if (!id && r.data?._id) {
          // After creating, redirect to edit page so content section appears
          this.router.navigate(['/admin/resources/edit', r.data._id], { state: { resource: r.data } });
        } else {
          this.successMsg.set('Resource saved successfully.');
          setTimeout(() => this.successMsg.set(''), 3000);
        }
      },
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Save failed. Please try again.');
        this.saving.set(false);
      },
    });
  }

  // ── MCQ Question management ────────────────────────────────────────────────
  openAddQuestion(): void { this.showAddQ.set(true); this.addQForm.reset({ correctAnswer: 'A', order: 0 }); }
  cancelAddQuestion(): void { this.showAddQ.set(false); }

  submitAddQuestion(): void {
    if (this.addQForm.invalid) { this.addQForm.markAllAsTouched(); return; }
    this.savingContent.set(true);
    this.contentError.set('');
    const v = this.addQForm.value;
    const body: Partial<McqQuestion> = {
      question:      v.question,
      choices:       { A: v.choiceA, B: v.choiceB, C: v.choiceC, D: v.choiceD },
      correctAnswer: v.correctAnswer,
      explanation:   v.explanation,
      order:         v.order,
      phase:         Number(v.phase) as 1 | 2,
    };
    this.resourceSvc.addQuestion(this.resourceId()!, body).subscribe({
      next:  () => { this.savingContent.set(false); this.showAddQ.set(false); this.loadContent(this.resourceId()!); },
      error: (e: { error?: { message?: string } }) => {
        this.contentError.set(e?.error?.message || 'Failed to add question.');
        this.savingContent.set(false);
      },
    });
  }

  startEditQuestion(q: McqQuestion): void {
    this.editingQId.set(q._id!);
    this.editQForm.patchValue({
      question:      q.question,
      choiceA:       q.choices.A,
      choiceB:       q.choices.B,
      choiceC:       q.choices.C,
      choiceD:       q.choices.D,
      correctAnswer: q.correctAnswer,
      explanation:   q.explanation ?? '',
      order:         q.order       ?? 0,
      phase:         q.phase       ?? 1,
    });
  }

  cancelEditQuestion(): void { this.editingQId.set(null); }

  submitEditQuestion(): void {
    if (this.editQForm.invalid) { this.editQForm.markAllAsTouched(); return; }
    this.savingContent.set(true);
    this.contentError.set('');
    const v = this.editQForm.value;
    const body: Partial<McqQuestion> = {
      question:      v.question,
      choices:       { A: v.choiceA, B: v.choiceB, C: v.choiceC, D: v.choiceD },
      correctAnswer: v.correctAnswer,
      explanation:   v.explanation,
      order:         v.order,
      phase:         Number(v.phase) as 1 | 2,
    };
    this.resourceSvc.updateQuestion(this.editingQId()!, body).subscribe({
      next:  () => { this.savingContent.set(false); this.editingQId.set(null); this.loadContent(this.resourceId()!); },
      error: (e: { error?: { message?: string } }) => {
        this.contentError.set(e?.error?.message || 'Failed to update question.');
        this.savingContent.set(false);
      },
    });
  }

  deleteQuestion(qid: string): void {
    if (!confirm('Delete this question?')) return;
    this.resourceSvc.deleteQuestion(qid).subscribe({
      next:  () => this.loadContent(this.resourceId()!),
      error: () => this.contentError.set('Failed to delete question.'),
    });
  }

  // ── Short Answer Card management ───────────────────────────────────────────
  openAddCard(): void { this.showAddCard.set(true); this.addCardForm.reset({ order: 0 }); }
  cancelAddCard(): void { this.showAddCard.set(false); }

  submitAddCard(): void {
    if (this.addCardForm.invalid) { this.addCardForm.markAllAsTouched(); return; }
    this.savingContent.set(true);
    this.contentError.set('');
    const v = this.addCardForm.value;
    const body: Partial<ShortAnswerCard> = {
      question: v.question, answer: v.answer, explanation: v.explanation, order: v.order,
      phase: Number(v.phase) as 1 | 2,
    };
    this.resourceSvc.addCard(this.resourceId()!, body).subscribe({
      next:  () => { this.savingContent.set(false); this.showAddCard.set(false); this.loadContent(this.resourceId()!); },
      error: (e: { error?: { message?: string } }) => {
        this.contentError.set(e?.error?.message || 'Failed to add card.');
        this.savingContent.set(false);
      },
    });
  }

  startEditCard(c: ShortAnswerCard): void {
    this.editingCardId.set(c._id!);
    this.editCardForm.patchValue({
      question:    c.question,
      answer:      c.answer,
      explanation: c.explanation ?? '',
      order:       c.order       ?? 0,
      phase:       c.phase       ?? 1,
    });
  }

  cancelEditCard(): void { this.editingCardId.set(null); }

  submitEditCard(): void {
    if (this.editCardForm.invalid) { this.editCardForm.markAllAsTouched(); return; }
    this.savingContent.set(true);
    this.contentError.set('');
    const v = this.editCardForm.value;
    this.resourceSvc.updateCard(this.editingCardId()!, v).subscribe({
      next:  () => { this.savingContent.set(false); this.editingCardId.set(null); this.loadContent(this.resourceId()!); },
      error: (e: { error?: { message?: string } }) => {
        this.contentError.set(e?.error?.message || 'Failed to update card.');
        this.savingContent.set(false);
      },
    });
  }

  deleteCard(cid: string): void {
    if (!confirm('Delete this card?')) return;
    this.resourceSvc.deleteCard(cid).subscribe({
      next:  () => this.loadContent(this.resourceId()!),
      error: () => this.contentError.set('Failed to delete card.'),
    });
  }

  // ── File upload handlers ───────────────────────────────────────────────────
  onThumbnailSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadThumbError.set('');
    this.uploadingThumb.set(true);
    this.uploadSvc.uploadThumbnail(file).subscribe({
      next: (res) => {
        // Store the S3 key as the thumbnailUrl value
        this.form.patchValue({ thumbnailUrl: res.data?.key ?? '' });
        this.uploadingThumb.set(false);
      },
      error: (e: { error?: { message?: string } }) => {
        this.uploadThumbError.set(e?.error?.message || 'Upload failed.');
        this.uploadingThumb.set(false);
      },
    });
  }

  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadPdfError.set('');
    this.uploadingPdf.set(true);
    this.uploadSvc.uploadPdf(file).subscribe({
      next: (res) => {
        this.form.patchValue({ pdfUrl: res.data?.key ?? '' });
        this.uploadingPdf.set(false);
      },
      error: (e: { error?: { message?: string } }) => {
        this.uploadPdfError.set(e?.error?.message || 'Upload failed.');
        this.uploadingPdf.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  back(): void { this.router.navigate(['/admin/resources']); }
  ctrl(name: string): AbstractControl { return this.form.get(name)!; }
  err(name: string, error: string): boolean {
    const c = this.ctrl(name);
    return c.hasError(error) && (c.dirty || c.touched);
  }
  invalid(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && (c.dirty || c.touched);
  }
  qCtrl(form: FormGroup, name: string): AbstractControl { return form.get(name)!; }
  qInvalid(form: FormGroup, name: string): boolean {
    const c = form.get(name)!;
    return c.invalid && (c.dirty || c.touched);
  }

  /** Safe accessor for MCQ question choices by label string */
  getQChoice(q: McqQuestion, label: string): string {
    return q.choices[label as 'A' | 'B' | 'C' | 'D'];
  }
}
