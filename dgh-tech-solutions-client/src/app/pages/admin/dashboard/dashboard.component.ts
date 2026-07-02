import { Component, OnInit, DestroyRef, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, timer, merge, EMPTY, Subject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { ContactService } from '../../../core/services/contact.service';
import { AnalyticsSummary, ContactMessage, Project } from '../../../core/models';
import { StatCardComponent } from './components/stat-card.component';
import { RecentMessagesComponent } from './components/recent-messages.component';
import { TopPagesComponent } from './components/top-pages.component';
import { RecentVisitsComponent } from './components/recent-visits.component';

const REFRESH_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, StatCardComponent, RecentMessagesComponent, TopPagesComponent, RecentVisitsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  analytics    = signal<AnalyticsSummary | null>(null);
  projects     = signal<Project[]>([]);
  messages     = signal<ContactMessage[]>([]);
  loading      = signal(true);
  error        = signal(false);
  refreshing   = signal(false);
  refreshError = signal('');
  lastUpdated  = signal<Date | null>(null);

  recentMessages = computed(() => this.messages().slice(0, 6));
  newMsgCount    = computed(() => this.messages().filter((m) => m.status === 'new').length);
  publishedCount = computed(() => this.projects().filter((p) => p.isPublished).length);
  featuredCount  = computed(() => this.projects().filter((p) => p.isFeatured).length);

  private destroyRef    = inject(DestroyRef);
  private manualRefresh$ = new Subject<void>();
  private isFirstLoad   = true;

  constructor(
    private analyticsSvc: AnalyticsService,
    private authSvc:      AuthService,
    private projectSvc:   ProjectService,
    private contactSvc:   ContactService,
    private router:       Router,
  ) {}

  getDeviceWidth(count: number): number {
    const devices = this.analytics()?.devices ?? [];
    const max = Math.max(...devices.map((d) => d.count), 1);
    return Math.round((count / max) * 100);
  }

  manualRefresh(): void {
    this.manualRefresh$.next();
  }

  ngOnInit(): void {
    if (this.authSvc.currentAdmin()?.role === 'publisher') {
      this.router.navigate(['/admin/publisher-dashboard'], { replaceUrl: true });
      return;
    }

    merge(timer(0, REFRESH_INTERVAL_MS), this.manualRefresh$).pipe(
      switchMap(() => {
        this.refreshError.set('');
        if (this.isFirstLoad) {
          this.loading.set(true);
        } else {
          this.refreshing.set(true);
        }

        return forkJoin({
          analytics: this.analyticsSvc.getSummary().pipe(
            catchError(() => of({ data: null } as { data: AnalyticsSummary | null }))
          ),
          projects: this.projectSvc.getAll().pipe(catchError(() => of({ data: [] }))),
          messages: this.contactSvc.getMessages(1, 20).pipe(catchError(() => of({ data: [] }))),
        }).pipe(
          catchError(() => {
            if (this.isFirstLoad) {
              this.error.set(true);
              this.loading.set(false);
            } else {
              this.refreshError.set('Could not refresh — showing last data.');
              this.refreshing.set(false);
            }
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ analytics, projects, messages }) => {
      this.analytics.set(analytics.data ?? null);
      this.projects.set(projects.data ?? []);
      this.messages.set(messages.data ?? []);
      this.lastUpdated.set(new Date());
      this.loading.set(false);
      this.refreshing.set(false);
      this.isFirstLoad = false;
    });
  }
}
