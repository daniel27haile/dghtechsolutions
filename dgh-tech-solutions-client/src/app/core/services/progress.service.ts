import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AdminProgressRecord, CourseProgress } from '../models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly base = `${environment.apiUrl}/progress`;

  constructor(private http: HttpClient) {}

  // ── User ──────────────────────────────────────────────────────────────────

  getProgress(resourceId: string): Observable<ApiResponse<CourseProgress | null>> {
    return this.http.get<ApiResponse<CourseProgress | null>>(`${this.base}/${resourceId}`);
  }

  updateProgress(
    resourceId: string,
    body: {
      completedItemIds?: string[];
      currentItemId?: string | null;
      progressPercentage?: number;
      status?: string;
    }
  ): Observable<ApiResponse<CourseProgress>> {
    return this.http.put<ApiResponse<CourseProgress>>(`${this.base}/${resourceId}`, body);
  }

  resetProgress(resourceId: string): Observable<ApiResponse<CourseProgress>> {
    return this.http.post<ApiResponse<CourseProgress>>(`${this.base}/${resourceId}/reset`, {});
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAllProgress(params?: {
    search?: string;
    resourceId?: string;
    status?: string;
  }): Observable<ApiResponse<AdminProgressRecord[]>> {
    let qp = new HttpParams();
    if (params?.search)     qp = qp.set('search',     params.search);
    if (params?.resourceId) qp = qp.set('resourceId', params.resourceId);
    if (params?.status)     qp = qp.set('status',     params.status);
    return this.http.get<ApiResponse<AdminProgressRecord[]>>(`${this.base}/admin/all`, { params: qp });
  }

  getProgressForResource(resourceId: string): Observable<ApiResponse<AdminProgressRecord[]>> {
    return this.http.get<ApiResponse<AdminProgressRecord[]>>(
      `${this.base}/admin/resource/${resourceId}`
    );
  }
}
