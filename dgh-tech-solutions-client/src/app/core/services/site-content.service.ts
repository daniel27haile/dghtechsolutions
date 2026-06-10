import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SiteContentSection } from '../models';

type SectionResponse = { success: boolean; data: SiteContentSection };
type AllResponse    = { success: boolean; data: Record<string, SiteContentSection> };

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly base = `${environment.apiUrl}/content`;
  private keyCache = new Map<string, Observable<SectionResponse>>();

  constructor(private http: HttpClient) {}

  getAll(): Observable<AllResponse> {
    return this.http.get<AllResponse>(this.base);
  }

  /** Cached per key — multiple components requesting the same key share one HTTP call. */
  getByKey(key: string): Observable<SectionResponse> {
    if (!this.keyCache.has(key)) {
      this.keyCache.set(
        key,
        this.http.get<SectionResponse>(`${this.base}/${key}`).pipe(shareReplay(1))
      );
    }
    return this.keyCache.get(key)!;
  }

  /** Saves content and invalidates the cached entry for that key. */
  upsert(key: string, body: Partial<SiteContentSection>): Observable<SectionResponse> {
    this.keyCache.delete(key);
    return this.http.put<SectionResponse>(`${this.base}/admin/${key}`, body);
  }
}
