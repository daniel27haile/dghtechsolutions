import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ContactMessage } from '../models';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceInterest?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly base = `${environment.apiUrl}/contact`;
  constructor(private http: HttpClient) {}

  submit(form: ContactFormData): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.base, form);
  }

  getMessages(page = 1, limit = 20): Observable<ApiResponse<ContactMessage[]>> {
    return this.http.get<ApiResponse<ContactMessage[]>>(
      `${this.base}/messages?page=${page}&limit=${limit}`
    );
  }

  updateStatus(id: string, status: ContactMessage['status']): Observable<ApiResponse<ContactMessage>> {
    return this.http.put<ApiResponse<ContactMessage>>(
      `${this.base}/messages/${id}/status`,
      { status }
    );
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/messages/${id}`);
  }
}
