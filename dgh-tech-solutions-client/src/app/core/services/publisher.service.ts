import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PublisherAccount, PublisherBalance, PublisherStats, PublisherSale } from '../models';

@Injectable({ providedIn: 'root' })
export class PublisherService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/publishers`;

  getAll(): Observable<ApiResponse<PublisherAccount[]>> {
    return this.http.get<ApiResponse<PublisherAccount[]>>(this.base);
  }

  create(data: {
    username: string; email: string; password: string;
    fullName: string; publisherName?: string; bio?: string;
  }): Observable<ApiResponse<PublisherAccount>> {
    return this.http.post<ApiResponse<PublisherAccount>>(this.base, data);
  }

  update(id: string, data: Partial<PublisherAccount & { password?: string }>): Observable<ApiResponse<PublisherAccount>> {
    return this.http.put<ApiResponse<PublisherAccount>>(`${this.base}/${id}`, data);
  }

  deactivate(id: string): Observable<ApiResponse<PublisherAccount>> {
    return this.http.delete<ApiResponse<PublisherAccount>>(`${this.base}/${id}`);
  }

  getMyStats(): Observable<ApiResponse<PublisherStats>> {
    return this.http.get<ApiResponse<PublisherStats>>(`${this.base}/me/stats`);
  }

  getMySales(): Observable<ApiResponse<PublisherSale[]>> {
    return this.http.get<ApiResponse<PublisherSale[]>>(`${this.base}/me/sales`);
  }
}
