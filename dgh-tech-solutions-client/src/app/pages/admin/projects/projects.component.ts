import { Component, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class AdminProjectsComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading  = signal(true);
  errorMsg = signal('');

  constructor(private projectSvc: ProjectService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.projectSvc.getAll().subscribe({
      next: (r) => { this.projects.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNew(): void {
    this.router.navigate(['/admin/projects/new']);
  }

  openEdit(p: Project): void {
    this.router.navigate(['/admin/projects/edit', p._id!], { state: { project: p } });
  }

  togglePublish(p: Project): void {
    this.errorMsg.set('');
    this.projectSvc.update(p._id!, { isPublished: !p.isPublished }).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to update publish status. Please try again.'); },
    });
  }

  toggleFeatured(p: Project): void {
    this.errorMsg.set('');
    this.projectSvc.update(p._id!, { isFeatured: !p.isFeatured }).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to update featured status. Please try again.'); },
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    this.projectSvc.delete(id).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to delete project. Please try again.'); },
    });
  }
}
