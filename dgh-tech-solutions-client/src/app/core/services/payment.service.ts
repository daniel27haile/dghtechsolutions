import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LibraryResponse, Resource } from '../models';

export interface CheckoutResponse {
  url: string;
  sessionId: string;
}

export interface AccessResponse {
  hasAccess: boolean;
}

export interface VerifySessionResponse {
  paid: boolean;
  resource: Resource | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(resourceId: string): Observable<ApiResponse<CheckoutResponse>> {
    return this.http.post<ApiResponse<CheckoutResponse>>(`${this.base}/checkout/${resourceId}`, {});
  }

  checkAccess(resourceId: string): Observable<ApiResponse<AccessResponse>> {
    return this.http.get<ApiResponse<AccessResponse>>(`${this.base}/access/${resourceId}`);
  }

  verifySession(sessionId: string): Observable<ApiResponse<VerifySessionResponse>> {
    return this.http.get<ApiResponse<VerifySessionResponse>>(`${this.base}/verify-session/${sessionId}`);
  }

  getMyLibrary(): Observable<ApiResponse<LibraryResponse>> {
    return this.http.get<ApiResponse<LibraryResponse>>(`${this.base}/my-library`);
  }

  saveResource(resourceId: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/save/${resourceId}`, {});
  }

  unsaveResource(resourceId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/save/${resourceId}`);
  }
}
