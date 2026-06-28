import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PayoutRequest, PublisherBalance } from '../models';

@Injectable({ providedIn: 'root' })
export class PayoutService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payouts`;

  getBalance(publisherId?: string): Observable<ApiResponse<PublisherBalance>> {
    const params = publisherId ? `?publisherId=${publisherId}` : '';
    return this.http.get<ApiResponse<PublisherBalance>>(`${this.base}/balance${params}`);
  }

  requestPayout(): Observable<ApiResponse<PayoutRequest>> {
    return this.http.post<ApiResponse<PayoutRequest>>(`${this.base}/request`, {});
  }

  getAll(): Observable<ApiResponse<PayoutRequest[]>> {
    return this.http.get<ApiResponse<PayoutRequest[]>>(this.base);
  }

  approve(id: string): Observable<ApiResponse<PayoutRequest>> {
    return this.http.put<ApiResponse<PayoutRequest>>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<ApiResponse<PayoutRequest>> {
    return this.http.put<ApiResponse<PayoutRequest>>(`${this.base}/${id}/reject`, { reason });
  }

  markPaid(id: string): Observable<ApiResponse<PayoutRequest>> {
    return this.http.put<ApiResponse<PayoutRequest>>(`${this.base}/${id}/mark-paid`, {});
  }
}
