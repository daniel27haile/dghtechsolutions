import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../core/models';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="project-card">
      @if (project.imageUrl) {
        <div class="thumb">
          <img
            [src]="project.imageUrl"
            [alt]="project.title + ' — project screenshot'"
            loading="lazy"
            width="400"
            height="225"
          />
        </div>
      }
      <div class="body">
        @if (project.category) {
          <span class="badge">{{ project.category }}</span>
        }
        <h3>{{ project.title }}</h3>
        <p>{{ project.shortDescription }}</p>
        @if (project.techStack?.length) {
          <div class="tags" aria-label="Technologies used">
            @for (t of project.techStack!.slice(0, 4); track t) {
              <span class="tag">{{ t }}</span>
            }
          </div>
        }
        <a [routerLink]="['/projects', project.slug]" class="btn-view"
           [attr.aria-label]="'View project: ' + project.title">
          View Project &rarr;
        </a>
      </div>
    </article>
  `,
  styles: [`
    .project-card {
      background:#fff; border-radius:16px; box-shadow:0 2px 16px rgba(0,0,0,.06);
      overflow:hidden; transition:box-shadow .25s,transform .25s; display:flex; flex-direction:column;
    }
    .project-card:hover { box-shadow:0 12px 40px rgba(var(--clr-primary-rgb),.12); transform:translateY(-4px); }
    .thumb { height:200px; overflow:hidden; }
    .thumb img { width:100%; height:100%; object-fit:cover; transition:transform .4s ease; }
    .thumb:hover img { transform:scale(1.05); }
    .body { padding:1.5rem; display:flex; flex-direction:column; gap:.75rem; flex:1; }
    .badge {
      display:inline-block; font-size:.72rem; font-weight:700; padding:.2rem .7rem;
      border-radius:999px; background:rgba(var(--clr-primary-rgb),.1);
      color:var(--clr-primary); width:fit-content; text-transform:uppercase; letter-spacing:.04em;
    }
    h3 { font-size:1.1rem; font-weight:700; color:var(--clr-dark); margin:0; }
    p { color:var(--clr-text-sub); font-size:.9rem; line-height:1.6; margin:0; flex:1; }
    .tags { display:flex; flex-wrap:wrap; gap:.4rem; }
    .tag {
      font-size:.75rem; padding:.2rem .6rem; border-radius:4px;
      background:var(--clr-gray-100); color:var(--clr-text-sub);
    }
    .btn-view {
      color:var(--clr-primary); font-weight:600; font-size:.9rem;
      text-decoration:none; display:inline-flex; align-items:center; gap:.3rem;
      transition:gap .2s;
    }
    .btn-view:hover { gap:.6rem; }
  `],
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;
}
