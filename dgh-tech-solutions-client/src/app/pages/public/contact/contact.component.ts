import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, OnDestroy {
  @ViewChild('formPanel') formPanelRef!: ElementRef<HTMLElement>;

  private successTimer: ReturnType<typeof setTimeout> | null = null;
  form: FormGroup;
  content  = signal<SiteContentSection | null>(null);
  loading  = signal(false);
  success  = signal(false);
  errorMsg = signal('');
  openFaq  = signal<number | null>(null);

  contactMeta = computed(() =>
    (this.content()?.metadata ?? {}) as Record<string, string>
  );

  projectTypes = [
    'Web Application',
    'Mobile Application',
    'Cloud Solution',
    'API Development',
    'System Integration',
    'AI Solution',
    'Other',
  ];

  budgets = [
    'Under $1,000',
    '$1,000 – $5,000',
    '$5,000 – $10,000',
    '$10,000 – $25,000',
    '$25,000+',
    'Not sure yet',
  ];

  timelines = [
    'ASAP',
    '2–4 weeks',
    '1–2 months',
    '3+ months',
    'Flexible',
  ];

  readonly faqItems = [
    {
      q: 'How quickly do you respond?',
      a: 'We respond to all project inquiries within one business day. For urgent matters, you can email us directly at info@dghtechsolutions.com.',
    },
    {
      q: 'Do you work with clients remotely?',
      a: 'Yes. We work with clients across the US and internationally. All project communication, planning, and delivery can be handled fully remote.',
    },
    {
      q: 'Can you improve an existing website or app?',
      a: 'Absolutely. Whether you need a performance audit, new features, a UI redesign, or a full refactor — we are experienced in taking over and improving existing codebases.',
    },
    {
      q: 'Do you build cloud-based or AI-ready applications?',
      a: 'Yes. We design and deploy cloud-native applications on AWS, Azure, and Google Cloud, and we can integrate AI/ML capabilities into new or existing platforms.',
    },
    {
      q: 'Can you work with small businesses and startups?',
      a: 'Yes. We work with businesses of all sizes — from early-stage startups building their first product to established companies scaling their infrastructure.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private contactSvc: ContactService,
    private contentSvc: SiteContentService,
  ) {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      company:     [''],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', [Validators.pattern(/^[\d\s\(\)\-\+\.]{7,20}$/)]],
      projectType: ['', Validators.required],
      budget:      [''],
      timeline:    [''],
      message:     ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  ngOnInit(): void {
    this.contentSvc.getByKey('contact.main').subscribe({
      next: (r) => this.content.set(r.data),
      error: () => {},
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    this.contactSvc.submit(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.form.reset();
        this.success.set(true);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Something went wrong. Please try again or email us directly at info@dghtechsolutions.com.');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  scrollToForm(): void {
    this.formPanelRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
