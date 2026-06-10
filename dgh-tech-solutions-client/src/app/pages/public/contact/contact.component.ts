import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../../core/services/contact.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, OnDestroy {
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  form: FormGroup;
  content  = signal<SiteContentSection | null>(null);
  loading  = signal(false);
  success  = signal(false);
  errorMsg = signal('');

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
    'Under $5,000',
    '$5,000 – $10,000',
    '$10,000 – $25,000',
    '$25,000 – $50,000',
    '$50,000+',
  ];

  timelines = [
    'ASAP',
    'Within 1 Month',
    '1–3 Months',
    '3–6 Months',
    'Flexible',
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
        if (this.successTimer) clearTimeout(this.successTimer);
        this.successTimer = setTimeout(() => this.success.set(false), 5000);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Something went wrong. Please try again.');
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
}
