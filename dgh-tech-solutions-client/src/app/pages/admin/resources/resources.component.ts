import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { ResourceService } from '../../../core/services/resource.service';
import { PublisherService } from '../../../core/services/publisher.service';
import { AuthService } from '../../../core/services/auth.service';
import { Resource, PublisherSale } from '../../../core/models';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [SlicePipe, CurrencyPipe, DatePipe],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss'],
})
export class AdminResourcesComponent implements OnInit {
  resources = signal<Resource[]>([]);
  sales     = signal<PublisherSale[]>([]);
  loading   = signal(true);
  errorMsg  = signal('');

  isPublisher = computed(() => this.authSvc.currentAdmin()?.role === 'publisher');

  // Per-resource stats computed from sales (publisher only)
  private statsMap = computed<Map<string, { units: number; net: number; students: number }>>(() => {
    const map = new Map<string, { units: number; net: number; buyers: Set<string> }>();
    for (const s of this.sales()) {
      let r = map.get(s.resourceId);
      if (!r) { r = { units: 0, net: 0, buyers: new Set() }; map.set(s.resourceId, r); }
      r.units++;
      r.net += s.publisherNet;
      if (s.buyer?._id) r.buyers.add(s.buyer._id);
    }
    const out = new Map<string, { units: number; net: number; students: number }>();
    map.forEach((v, k) => out.set(k, { units: v.units, net: v.net, students: v.buyers.size }));
    return out;
  });

  constructor(
    private resourceSvc:  ResourceService,
    private publisherSvc: PublisherService,
    private authSvc:      AuthService,
    private router:       Router,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.resourceSvc.getAll().subscribe({
      next: (r) => {
        this.resources.set(r.data ?? []);
        if (this.isPublisher()) {
          this.publisherSvc.getMySales().subscribe({
            next:  (sr) => { this.sales.set(sr.data ?? []); this.loading.set(false); },
            error: ()   => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  getSalesUnits(id: string):    number { return this.statsMap().get(id)?.units    ?? 0; }
  getSalesNet(id: string):      number { return this.statsMap().get(id)?.net      ?? 0; }
  getSalesStudents(id: string): number { return this.statsMap().get(id)?.students ?? 0; }

  openNew(): void { this.router.navigate(['/admin/resources/new']); }

  openEdit(r: Resource): void {
    this.router.navigate(['/admin/resources/edit', r._id!], { state: { resource: r } });
  }

  togglePublish(r: Resource): void {
    this.errorMsg.set('');
    this.resourceSvc.togglePublish(r._id!).subscribe({
      next:  () => this.load(),
      error: () => this.errorMsg.set('Failed to update publish status.'),
    });
  }

  toggleFeatured(r: Resource): void {
    this.errorMsg.set('');
    this.resourceSvc.update(r._id!, { isFeatured: !r.isFeatured }).subscribe({
      next:  () => this.load(),
      error: () => this.errorMsg.set('Failed to update featured status.'),
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this resource? All associated questions and cards will also be deleted. This cannot be undone.')) return;
    this.resourceSvc.delete(id).subscribe({
      next:  () => this.load(),
      error: () => this.errorMsg.set('Failed to delete resource.'),
    });
  }

  /** Publisher can only edit/delete resources they own */
  canEdit(r: Resource): boolean {
    if (!this.isPublisher()) return true;
    return r.ownerId === this.authSvc.currentAdmin()?.id;
  }

  typeBadge(type: string): string {
    const map: Record<string, string> = {
      PDF: 'PDF', MULTIPLE_CHOICE: 'MCQ', SHORT_ANSWER: 'Flashcards',
    };
    return map[type] ?? type;
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      PDF: 'type--pdf', MULTIPLE_CHOICE: 'type--mcq', SHORT_ANSWER: 'type--sa',
    };
    return map[type] ?? '';
  }
}
