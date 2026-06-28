import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly base = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) {}

  uploadThumbnail(file: File): Observable<ApiResponse<{ key: string }>> {
    const fd = new FormData();
    fd.append('thumbnail', file);
    return this.http.post<ApiResponse<{ key: string }>>(`${this.base}/thumbnail`, fd);
  }

  uploadPdf(file: File): Observable<ApiResponse<{ key: string }>> {
    const fd = new FormData();
    fd.append('pdf', file);
    return this.http.post<ApiResponse<{ key: string }>>(`${this.base}/pdf`, fd);
  }

  /** Get a short-lived presigned URL for a private S3 key */
  getPresignedUrl(key: string): Observable<ApiResponse<{ url: string }>> {
    return this.http.get<ApiResponse<{ url: string }>>(`${this.base}/presign`, {
      params: { key },
    });
  }
}
