import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { ProjectModalComponent } from '../project-modal/project-modal.component';

@Component({
  selector: 'app-project-carousel',
  standalone: true,
  imports: [RouterLink, ProjectModalComponent],
  templateUrl: './project-carousel.component.html',
  styleUrls: ['./project-carousel.component.scss'],
})
export class ProjectCarouselComponent implements OnInit {
  projects        = signal<Project[]>([]);
  loading         = signal(true);
  error           = signal(false);
  selectedProject = signal<Project | null>(null);

  /** Six skeleton placeholders — fills a 3×2 grid while loading. */
  readonly skeletons = [0, 1, 2, 3, 4, 5];

  constructor(private projectSvc: ProjectService) {}

  ngOnInit(): void { this.loadProjects(); }

  loadProjects(): void {
    this.loading.set(true);
    this.error.set(false);
    this.projectSvc.getFeatured().subscribe({
      next:  (r) => { this.projects.set(r.data ?? []); this.loading.set(false); },
      error: ()  => { this.error.set(true);             this.loading.set(false); },
    });
  }

  retryLoad(): void { this.loadProjects(); }

  openModal(p: Project): void { this.selectedProject.set(p); }
  closeModal(): void          { this.selectedProject.set(null); }
}
