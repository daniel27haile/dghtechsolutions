import { Component, OnInit, signal, computed } from '@angular/core';
import { ProgressService } from '../../../core/services/progress.service';
import { ResourceService } from '../../../core/services/resource.service';
import { AdminProgressRecord, Resource } from '../../../core/models';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-admin-progress',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class AdminProgressComponent implements OnInit {
  records   = signal<AdminProgressRecord[]>([]);
  resources = signal<Resource[]>([]);
  loading   = signal(true);
  errorMsg  = signal('');

  searchTerm      = signal('');
  filterResourceId = signal('');
  filterStatus    = signal('');

  filteredRecords = computed(() => {
    let list = this.records();
    const s  = this.searchTerm().toLowerCase().trim();
    const r  = this.filterResourceId();
    const st = this.filterStatus();

    if (s) {
      list = list.filter((p) =>
        p.userName.toLowerCase().includes(s) ||
        p.userEmail.toLowerCase().includes(s) ||
        p.resourceTitle.toLowerCase().includes(s)
      );
    }
    if (r)  list = list.filter((p) => p.resourceId === r);
    if (st) list = list.filter((p) => p.status === st);

    return list;
  });

  summary = computed(() => {
    const list = this.filteredRecords();
    return {
      total:       list.length,
      completed:   list.filter((p) => p.status === 'completed').length,
      in_progress: list.filter((p) => p.status === 'in_progress').length,
      not_started: list.filter((p) => p.status === 'not_started').length,
    };
  });

  constructor(
    private progressSvc: ProgressService,
    private resourceSvc: ResourceService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.resourceSvc.getAll().subscribe({
      next:  (r) => this.resources.set(r.data ?? []),
      error: ()  => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.progressSvc.getAllProgress().subscribe({
      next:  (r) => { this.records.set(r.data ?? []); this.loading.set(false); },
      error: ()  => { this.errorMsg.set('Failed to load progress data.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void {
    this.searchTerm.set((e.target as HTMLInputElement).value);
  }

  onResourceFilter(e: Event): void {
    this.filterResourceId.set((e.target as HTMLSelectElement).value);
  }

  onStatusFilter(e: Event): void {
    this.filterStatus.set((e.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterResourceId.set('');
    this.filterStatus.set('');
    // Reset select elements visually
    const els = document.querySelectorAll<HTMLSelectElement>('.filter-select');
    els.forEach((el) => (el.value = ''));
    const inp = document.querySelector<HTMLInputElement>('.search-input');
    if (inp) inp.value = '';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed:   'Completed',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      not_started: 'status--not-started',
      in_progress: 'status--in-progress',
      completed:   'status--completed',
    };
    return map[status] ?? '';
  }

  typeBadge(type: string): string {
    const map: Record<string, string> = {
      PDF: 'PDF', MULTIPLE_CHOICE: 'MCQ', SHORT_ANSWER: 'Flashcards', BUNDLE: 'Bundle',
    };
    return map[type] ?? type;
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }
}
