import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ServiceService } from '../../../../core/services/service.service';
import { Service } from '../../../../core/models';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss'],
})
export class ServiceFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  serviceId    = signal<string | null>(null);
  loading      = signal(false);
  saving       = signal(false);
  errorMsg     = signal('');
  imagePreview = signal('');

  private imgSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private svc: ServiceService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.serviceId.set(id);
    this.buildForm();
    this.imgSub = this.form.get('imageUrl')!.valueChanges.subscribe((url: string) => {
      this.imagePreview.set((url ?? '').trim());
    });

    if (id) {
      const stateService = (history.state as { service?: Service }).service;
      if (stateService?._id === id) {
        this.patchForm(stateService);
      } else {
        this.loading.set(true);
        this.svc.getAll().subscribe({
          next: (r) => {
            const s = (r.data ?? []).find((x) => x._id === id);
            if (s) this.patchForm(s);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      }
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      title:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      fullDescription:  [''],
      icon:             [''],
      imageUrl:         [''],
      published:        [false],
      featured:         [false],
      displayOrder:     [0, [Validators.min(0), Validators.max(999)]],
    });
  }

  patchForm(s: Service): void {
    this.form.patchValue({
      title:            s.title            ?? '',
      shortDescription: s.shortDescription ?? '',
      fullDescription:  s.fullDescription  ?? '',
      icon:             s.icon             ?? '',
      imageUrl:         s.imageUrl         ?? '',
      published:        s.isPublished,
      featured:         s.isFeatured,
      displayOrder:     s.sortOrder        ?? 0,
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMsg.set('');
    const raw = this.form.value;
    const payload: Partial<Service> = {
      title:            raw.title,
      shortDescription: raw.shortDescription,
      fullDescription:  raw.fullDescription,
      icon:             raw.icon,
      imageUrl:         raw.imageUrl,
      isPublished:      raw.published,
      isFeatured:       raw.featured,
      sortOrder:        raw.displayOrder,
    };
    const id = this.serviceId();
    const op = id ? this.svc.update(id, payload) : this.svc.create(payload);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/services']);
      },
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Save failed. Please try again.');
        this.saving.set(false);
      },
    });
  }

  ngOnDestroy(): void { this.imgSub?.unsubscribe(); }

  back(): void { this.router.navigate(['/admin/services']); }

  ctrl(name: string): AbstractControl { return this.form.get(name)!; }

  err(name: string, error: string): boolean {
    const c = this.ctrl(name);
    return c.hasError(error) && (c.dirty || c.touched);
  }

  invalid(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && (c.dirty || c.touched);
  }
}
