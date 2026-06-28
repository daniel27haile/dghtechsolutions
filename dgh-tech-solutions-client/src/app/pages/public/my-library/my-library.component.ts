import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { ProgressService } from '../../../core/services/progress.service';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { CourseProgress, LibraryItem, Resource } from '../../../core/models';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-my-library',
  standalone: true,
  imports: [RouterLink, ProgressBarComponent],
  templateUrl: './my-library.component.html',
  styleUrls: ['./my-library.component.scss'],
})
export class MyLibraryComponent implements OnInit {
  purchased          = signal<LibraryItem[]>([]);
  savedFree          = signal<LibraryItem[]>([]);
  loading            = signal(true);
  errorMsg           = signal('');
  progressMap        = signal<Record<string, CourseProgress | null>>({});
  pendingRemoveItem  = signal<LibraryItem | null>(null);
  removing           = signal(false);

  constructor(
    private paymentSvc:  PaymentService,
    private progressSvc: ProgressService,
    private toastSvc:    ToastService,
    public  userAuth:    UserAuthService,
    private router:      Router,
  ) {}

  ngOnInit(): void {
    this.paymentSvc.getMyLibrary().subscribe({
      next: (r) => {
        const data = r.data ?? { purchased: [], savedFree: [] };
        this.purchased.set(data.purchased);
        this.savedFree.set(data.savedFree);
        this.loading.set(false);
        this.loadProgress([...data.purchased, ...data.savedFree]);
      },
      error: () => { this.errorMsg.set('Failed to load your library.'); this.loading.set(false); },
    });
  }

  private loadProgress(items: LibraryItem[]): void {
    items
      .filter((i) => i.resource.type !== 'BUNDLE')
      .forEach((item) => {
        const rid = item.resource._id ?? '';
        if (!rid) return;
        this.progressSvc.getProgress(rid).subscribe({
          next:  (res) => this.progressMap.update((m) => ({ ...m, [rid]: res.data ?? null })),
          error: ()    => this.progressMap.update((m) => ({ ...m, [rid]: null })),
        });
      });
  }

  get totalCount(): number {
    return this.purchased().length + this.savedFree().length;
  }

  get hasItems(): boolean {
    return this.totalCount > 0;
  }

  getProgressPct(resourceId: string): number {
    return this.progressMap()[resourceId]?.progressPercentage ?? 0;
  }

  isCompleted(resourceId: string): boolean {
    return this.progressMap()[resourceId]?.status === 'completed';
  }

  hasStarted(resourceId: string): boolean {
    return (this.progressMap()[resourceId]?.progressPercentage ?? 0) > 0;
  }

  openResource(r: Resource): void {
    this.router.navigate(['/resources', r._id], { state: { resource: r } });
  }

  requestRemove(item: LibraryItem): void {
    this.pendingRemoveItem.set(item);
  }

  cancelRemove(): void {
    this.pendingRemoveItem.set(null);
  }

  confirmRemove(): void {
    const item = this.pendingRemoveItem();
    const id   = item?.resource._id;
    if (!item || !id) return;
    this.removing.set(true);
    this.paymentSvc.unsaveResource(id).subscribe({
      next: () => {
        this.savedFree.update(list => list.filter(i => i.resource._id !== id));
        this.pendingRemoveItem.set(null);
        this.removing.set(false);
        this.toastSvc.show(`"${item.resource.title}" removed from library.`, 'info');
      },
      error: (e: { error?: { message?: string } }) => {
        this.removing.set(false);
        this.toastSvc.show(e?.error?.message || 'Could not remove resource.', 'error');
      },
    });
  }

  typeBadge(type: string): string {
    const map: Record<string, string> = {
      PDF: 'PDF Guide', MULTIPLE_CHOICE: 'Multiple Choice', SHORT_ANSWER: 'Flashcards', BUNDLE: 'Bundle',
    };
    return map[type] ?? type;
  }

  openLabel(item: LibraryItem): string {
    const rid = item.resource._id ?? '';
    if (item.resource.type === 'BUNDLE') return 'View Bundle';

    const p = this.progressMap()[rid];
    if (p?.status === 'completed')         return 'Review Again';
    if ((p?.progressPercentage ?? 0) > 0)  return 'Resume Course';

    const map: Record<string, string> = {
      PDF: 'Start Reading', MULTIPLE_CHOICE: 'Start Quiz', SHORT_ANSWER: 'Study Flashcards',
    };
    return map[item.resource.type] ?? 'Open Resource';
  }
}
