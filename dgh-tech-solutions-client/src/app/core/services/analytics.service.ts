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
    this.http.post(`${this.base}/track`, {
      path,
      referrer: document.referrer,
    }).subscribe({ error: () => {} });
  }
}
