import { Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatCardComponent, RecentMessagesComponent, TopPagesComponent, RecentVisitsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  analytics = signal<AnalyticsSummary | null>(null);
  projects  = signal<Project[]>([]);
  messages  = signal<ContactMessage[]>([]);
  loading   = signal(true);
  error     = signal(false);

  recentMessages = computed(() => this.messages().slice(0, 6));
  newMsgCount    = computed(() => this.messages().filter((m) => m.status === 'new').length);
  publishedCount = computed(() => this.projects().filter((p) => p.isPublished).length);
  featuredCount  = computed(() => this.projects().filter((p) => p.isFeatured).length);

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

  ngOnInit(): void {
    if (this.authSvc.currentAdmin()?.role === 'publisher') {
      this.router.navigate(['/admin/publisher-dashboard'], { replaceUrl: true });
      return;
    }
    forkJoin({
      analytics: this.analyticsSvc.getSummary().pipe(catchError(() => of({ data: null } as { data: AnalyticsSummary | null }))),
      projects:  this.projectSvc.getAll().pipe(catchError(() => of({ data: [] }))),
      messages:  this.contactSvc.getMessages(1, 20).pipe(catchError(() => of({ data: [] }))),
    }).subscribe({
      next: ({ analytics, projects, messages }) => {
        this.analytics.set(analytics.data ?? null);
        this.projects.set(projects.data ?? []);
        this.messages.set(messages.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
