import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Service } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly base = `${environment.apiUrl}/services`;
  constructor(private http: HttpClient) {}

  // ── Public ────────────────────────────────────────────────────────────────
  getActive(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(this.base);
  }
  getFeatured(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${this.base}/featured`);
  }
  getBySlug(slug: string): Observable<ApiResponse<Service>> {
    return this.http.get<ApiResponse<Service>>(`${this.base}/${slug}`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAll(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${this.base}/admin`);
  }
  create(body: Partial<Service>): Observable<ApiResponse<Service>> {
    return this.http.post<ApiResponse<Service>>(this.base, body);
  }
  update(id: string, body: Partial<Service>): Observable<ApiResponse<Service>> {
    return this.http.put<ApiResponse<Service>>(`${this.base}/${id}`, body);
  }
  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
