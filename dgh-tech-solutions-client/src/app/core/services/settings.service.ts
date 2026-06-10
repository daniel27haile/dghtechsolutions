import { Injectable, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, filter, tap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SiteSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly base = `${environment.apiUrl}/settings`;
  private readonly _latest = new BehaviorSubject<SiteSettings | null>(null);
  private cache$: Observable<ApiResponse<SiteSettings>> | null = null;

  /**
   * Reactive stream of the most recent SiteSettings.
   * Emits once the first GET resolves, then again on every successful PUT.
   * Subscribe with takeUntilDestroyed() to avoid memory leaks.
   */
  readonly latest$: Observable<SiteSettings> = this._latest.pipe(
    filter((s): s is SiteSettings => s !== null),
  );

  constructor(private http: HttpClient) {}

  /** One-shot fetch — caches the observable so parallel callers share one request. */
  get(): Observable<ApiResponse<SiteSettings>> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<ApiResponse<SiteSettings>>(this.base)
        .pipe(
          tap(r => { if (r.data) this._latest.next(r.data); }),
          shareReplay(1),
        );
    }
    return this.cache$;
  }

  /** Saves settings, invalidates cache, and pushes the updated doc to latest$. */
  update(data: Partial<SiteSettings>): Observable<ApiResponse<SiteSettings>> {
    this.cache$ = null;
    return this.http
      .put<ApiResponse<SiteSettings>>(this.base, data)
      .pipe(tap(r => { if (r.data) this._latest.next(r.data); }));
  }
}
