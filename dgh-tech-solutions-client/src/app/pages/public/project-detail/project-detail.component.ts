import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (project()) {
      <article class="detail-page">
        @if (project()!.imageUrl) {
          <div class="hero-img">
            <img
              [src]="project()!.imageUrl"
              [alt]="project()!.title + ' — project screenshot'"
              width="1200"
              height="440"
            />
          </div>
        }
        <div class="container">
          <div class="meta">
            @if (project()!.category) {
              <span class="cat-badge">{{ project()!.category }}</span>
            }
            <h1>{{ project()!.title }}</h1>
            <p class="short-desc">{{ project()!.shortDescription }}</p>
          </div>

          @if (project()!.techStack?.length) {
            <div class="tags" aria-label="Technologies used">
              @for (t of project()!.techStack!; track t) {
                <span class="tag">{{ t }}</span>
              }
            </div>
          }

          @if (project()!.fullDescription) {
            <div class="full-desc">
              <h2>About This Project</h2>
              <p>{{ project()!.fullDescription }}</p>
            </div>
          }

          <div class="links">
            @if (project()!.liveUrl) {
              <a [href]="project()!.liveUrl" target="_blank" rel="noopener noreferrer"
                 class="btn-primary-link"
                 [attr.aria-label]="'View live demo for ' + project()!.title + ' (opens in new tab)'">
                Live Demo &#8599;
              </a>
            }
            @if (project()!.githubUrl) {
              <a [href]="project()!.githubUrl" target="_blank" rel="noopener noreferrer"
                 class="btn-outline-link"
                 [attr.aria-label]="'View source code on GitHub (opens in new tab)'">
                GitHub &#8599;
              </a>
            }
          </div>

          <a routerLink="/" class="back-link">&larr; Back to Home</a>
        </div>
      </article>
    } @else {
      <div class="not-found" role="alert">
        <h1>Project Not Found</h1>
        <p>The project you're looking for doesn't exist or may have been removed.</p>
        <a routerLink="/" class="btn-primary-link">Go Home</a>
      </div>
    }
  `,
  styles: [`
    .detail-page { min-height:100vh; }
    .hero-img { height:440px; overflow:hidden; background:var(--clr-gray-100); }
    .hero-img img { width:100%; height:100%; object-fit:cover; display:block; }
    .container { max-width:900px; margin:0 auto; padding:3rem 1.5rem; }
    .meta { margin-bottom:1.75rem; }
    .cat-badge {
      font-size:.72rem; font-weight:700; padding:.25rem .75rem; border-radius:999px;
      background:rgba(var(--clr-primary-rgb),.1); color:var(--clr-primary);
      text-transform:uppercase; letter-spacing:.04em; display:inline-block; margin-bottom:1rem;
    }
    h1 { font-size:clamp(1.9rem,3vw,2.8rem); font-weight:700; letter-spacing:-.02em; line-height:1.1; color:var(--clr-dark); margin:0 0 .75rem; }
    .short-desc { font-size:1.1rem; color:var(--clr-text-sub); line-height:1.7; }
    .tags { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:2.5rem; }
    .tag { font-size:.8rem; padding:.3rem .75rem; border-radius:6px; background:var(--clr-gray-100); border:1px solid var(--clr-border); color:var(--clr-text-sub); }
    .full-desc { margin-bottom:2rem; }
    .full-desc h2 { font-size:1.3rem; font-weight:700; color:var(--clr-dark); margin:0 0 .75rem; }
    .full-desc p { color:var(--clr-text-sub); line-height:1.8; }
    .links { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:2.5rem; }
    .btn-primary-link {
      padding:.75rem 2rem; border-radius:10px; background:var(--clr-primary); color:#fff;
      font-weight:700; text-decoration:none; transition:all .2s;
      &:hover { background:var(--clr-primary-hover); transform:translateY(-2px); }
    }
    .btn-outline-link {
      padding:.75rem 2rem; border-radius:10px; border:2px solid var(--clr-primary);
      color:var(--clr-primary); font-weight:700; text-decoration:none; background:transparent;
      transition:all .2s;
      &:hover { background:var(--clr-primary); color:#fff; }
    }
    .back-link { color:var(--clr-primary); font-weight:600; text-decoration:none; font-size:.9rem; }
    .back-link:hover { text-decoration:underline; }
    .not-found { text-align:center; padding:8rem 1.5rem; }
    .not-found h1 { font-size:2rem; font-weight:700; color:var(--clr-dark); margin:0 0 1rem; }
    .not-found p { color:var(--clr-text-sub); margin:0 0 2rem; }
  `],
})
export class ProjectDetailComponent implements OnInit {
  project = signal<Project | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private projectSvc: ProjectService,
    private titleSvc: Title,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.projectSvc.getBySlug(slug).subscribe({
      next: (r) => {
        this.project.set(r.data ?? null);
        this.loading.set(false);
        if (r.data?.title) {
          this.titleSvc.setTitle(`${r.data.title} | DGH Tech Solutions`);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
