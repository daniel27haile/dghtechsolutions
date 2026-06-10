import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Project } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly base = `${environment.apiUrl}/projects`;
  constructor(private http: HttpClient) {}

  // ── Public ────────────────────────────────────────────────────────────────
  getPublished(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.base);
  }
  getFeatured(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(`${this.base}/featured`);
  }
  getBySlug(slug: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.base}/${slug}`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAll(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(`${this.base}/admin`);
  }
  create(body: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.base, body);
  }
  update(id: string, body: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.base}/${id}`, body);
  }
  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
