import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../core/models';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  projectId    = signal<string | null>(null);
  loading      = signal(false);
  saving       = signal(false);
  errorMsg     = signal('');
  imagePreview = signal('');

  private imgSub?: Subscription;

  readonly categories = [
    'Web Development', 'Mobile App', 'UI/UX Design', 'E-Commerce', 'SaaS', 'API Integration', 'Cloud Solutions', 'Other',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private projectSvc: ProjectService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.projectId.set(id);
    this.buildForm();
    this.imgSub = this.form.get('imageUrl')!.valueChanges.subscribe((url: string) => {
      this.imagePreview.set((url ?? '').trim());
    });

    if (id) {
      // Try router navigation state first (cheaper — no extra API call)
      const stateProject = (history.state as { project?: Project }).project;
      if (stateProject?._id === id) {
        this.patchForm(stateProject);
      } else {
        // Fallback: load all projects and filter
        this.loading.set(true);
        this.projectSvc.getAll().subscribe({
          next: (r) => {
            const p = (r.data ?? []).find((x) => x._id === id);
            if (p) this.patchForm(p);
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
      problemSolved:    [''],
      features:         [''],
      category:         [''],
      techStack:        [''],
      imageUrl:         [''],
      liveUrl:          [''],
      githubUrl:        [''],
      client:           [''],
      published:        [false],
      featured:         [false],
      displayOrder:     [0, [Validators.min(0), Validators.max(999)]],
    });
  }

  patchForm(p: Project): void {
    this.form.patchValue({
      title:            p.title            ?? '',
      shortDescription: p.shortDescription ?? '',
      fullDescription:  p.fullDescription  ?? '',
      problemSolved:    p.problemSolved    ?? '',
      features:         p.features?.join('\n') ?? '',
      category:         p.category         ?? '',
      techStack:        p.techStack?.join(', ') ?? '',
      imageUrl:         p.imageUrl         ?? '',
      liveUrl:          p.liveUrl          ?? '',
      githubUrl:        p.githubUrl        ?? '',
      client:           p.client           ?? '',
      published:        p.isPublished,
      featured:         p.isFeatured,
      displayOrder:     p.sortOrder        ?? 0,
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
    const payload: Partial<Project> = {
      title:            raw.title,
      shortDescription: raw.shortDescription,
      fullDescription:  raw.fullDescription,
      problemSolved:    raw.problemSolved,
      category:         raw.category,
      imageUrl:         raw.imageUrl,
      liveUrl:          raw.liveUrl,
      githubUrl:        raw.githubUrl,
      client:           raw.client,
      isPublished:      raw.published,
      isFeatured:       raw.featured,
      sortOrder:        raw.displayOrder,
      techStack: raw.techStack
        ? (raw.techStack as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      features: raw.features
        ? (raw.features as string).split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [],
    };
    const id = this.projectId();
    const op = id ? this.projectSvc.update(id, payload) : this.projectSvc.create(payload);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/projects']);
      },
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Save failed. Please try again.');
        this.saving.set(false);
      },
    });
  }

  ngOnDestroy(): void { this.imgSub?.unsubscribe(); }

  back(): void { this.router.navigate(['/admin/projects']); }

  // Field helpers for cleaner template expressions
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
