import { Component, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceService } from '../../../core/services/service.service';
import { Service } from '../../../core/models';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class AdminServicesComponent implements OnInit {
  services = signal<Service[]>([]);
  loading  = signal(true);
  errorMsg = signal('');

  constructor(private svc: ServiceService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (r) => { this.services.set(r.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNew(): void {
    this.router.navigate(['/admin/services/new']);
  }

  openEdit(s: Service): void {
    this.router.navigate(['/admin/services/edit', s._id!], { state: { service: s } });
  }

  togglePublish(s: Service): void {
    this.errorMsg.set('');
    this.svc.update(s._id!, { isPublished: !s.isPublished }).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to update publish status. Please try again.'); },
    });
  }

  toggleFeatured(s: Service): void {
    this.errorMsg.set('');
    this.svc.update(s._id!, { isFeatured: !s.isFeatured }).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to update featured status. Please try again.'); },
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    this.svc.delete(id).subscribe({
      next: () => this.load(),
      error: () => { this.errorMsg.set('Failed to delete service. Please try again.'); },
    });
  }
}
