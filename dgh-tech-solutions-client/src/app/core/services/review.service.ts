import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Review, ReviewSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly base = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getReviews(resourceId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.base}/${resourceId}`);
  }

  getReviewSummary(resourceId: string): Observable<ApiResponse<ReviewSummary>> {
    return this.http.get<ApiResponse<ReviewSummary>>(`${this.base}/${resourceId}/summary`);
  }

  getMyReview(resourceId: string): Observable<ApiResponse<Review | null>> {
    return this.http.get<ApiResponse<Review | null>>(`${this.base}/${resourceId}/mine`);
  }

  createReview(resourceId: string, body: { rating: number; comment?: string }): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.base}/${resourceId}`, body);
  }

  getAdminReviews(resourceId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.base}/admin/${resourceId}`);
  }
}
