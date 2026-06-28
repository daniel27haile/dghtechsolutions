import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsSummary, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient, private router: Router) {}

  init(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (!e.urlAfterRedirects.startsWith('/admin')) {
          this.track(e.urlAfterRedirects);
        }
      });
  }

  getSummary(): Observable<ApiResponse<AnalyticsSummary>> {
    return this.http.get<ApiResponse<AnalyticsSummary>>(`${this.base}/summary`);
  }

  getRecent(limit = 50): Observable<ApiResponse<unknown[]>> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.base}/recent?limit=${limit}`);
  }

  getPages(days = 30, limit = 20): Observable<ApiResponse<unknown[]>> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.base}/pages?days=${days}&limit=${limit}`);
  }

  private track(path: string): void {
    // Deduplicate per path per day — prevents refresh inflation while still
    // recording every unique page a visitor navigates to within the same day.
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key   = `dgh_visit_${path}_${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');

    // Persist an anonymous session ID for the duration of the browser session.
    let sessionId = sessionStorage.getItem('dgh_session_id');
    if (!sessionId) {
      sessionId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
      sessionStorage.setItem('dgh_session_id', sessionId);
    }

    this.http.post(`${this.base}/track`, {
      path,
      referrer: document.referrer,
      sessionId,
    }).subscribe({ error: () => {} });
  }
}
