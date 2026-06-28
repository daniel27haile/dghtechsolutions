import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, McqQuestion, Resource, ShortAnswerCard } from '../models';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly base = `${environment.apiUrl}/resources`;
  constructor(private http: HttpClient) {}

  // ── Public ────────────────────────────────────────────────────────────────
  getPublished(params?: { category?: string; type?: string; search?: string }): Observable<ApiResponse<Resource[]>> {
    let qp = new HttpParams();
    if (params?.category) qp = qp.set('category', params.category);
    if (params?.type)     qp = qp.set('type',     params.type);
    if (params?.search)   qp = qp.set('search',   params.search);
    return this.http.get<ApiResponse<Resource[]>>(this.base, { params: qp });
  }

  getFeatured(): Observable<ApiResponse<Resource[]>> {
    return this.http.get<ApiResponse<Resource[]>>(`${this.base}/featured`);
  }

  getById(id: string): Observable<ApiResponse<Resource>> {
    return this.http.get<ApiResponse<Resource>>(`${this.base}/${id}`);
  }

  getQuestions(resourceId: string): Observable<ApiResponse<McqQuestion[]>> {
    return this.http.get<ApiResponse<McqQuestion[]>>(`${this.base}/${resourceId}/questions`);
  }

  getCards(resourceId: string): Observable<ApiResponse<ShortAnswerCard[]>> {
    return this.http.get<ApiResponse<ShortAnswerCard[]>>(`${this.base}/${resourceId}/cards`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAll(): Observable<ApiResponse<Resource[]>> {
    return this.http.get<ApiResponse<Resource[]>>(`${this.base}/admin/all`);
  }

  getAdminById(id: string): Observable<ApiResponse<Resource>> {
    return this.http.get<ApiResponse<Resource>>(`${this.base}/admin/${id}`);
  }

  create(body: Partial<Resource>): Observable<ApiResponse<Resource>> {
    return this.http.post<ApiResponse<Resource>>(`${this.base}/admin`, body);
  }

  update(id: string, body: Partial<Resource>): Observable<ApiResponse<Resource>> {
    return this.http.put<ApiResponse<Resource>>(`${this.base}/admin/${id}`, body);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/admin/${id}`);
  }

  togglePublish(id: string): Observable<ApiResponse<Resource>> {
    return this.http.patch<ApiResponse<Resource>>(`${this.base}/admin/${id}/publish`, {});
  }

  // ── Admin – MCQ Questions ─────────────────────────────────────────────────
  getAdminQuestions(resourceId: string): Observable<ApiResponse<McqQuestion[]>> {
    return this.http.get<ApiResponse<McqQuestion[]>>(`${this.base}/admin/${resourceId}/questions`);
  }

  addQuestion(resourceId: string, body: Partial<McqQuestion>): Observable<ApiResponse<McqQuestion>> {
    return this.http.post<ApiResponse<McqQuestion>>(`${this.base}/admin/${resourceId}/questions`, body);
  }

  updateQuestion(qid: string, body: Partial<McqQuestion>): Observable<ApiResponse<McqQuestion>> {
    return this.http.put<ApiResponse<McqQuestion>>(`${this.base}/admin/questions/${qid}`, body);
  }

  deleteQuestion(qid: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/admin/questions/${qid}`);
  }

  // ── Admin – Short Answer Cards ────────────────────────────────────────────
  getAdminCards(resourceId: string): Observable<ApiResponse<ShortAnswerCard[]>> {
    return this.http.get<ApiResponse<ShortAnswerCard[]>>(`${this.base}/admin/${resourceId}/cards`);
  }

  addCard(resourceId: string, body: Partial<ShortAnswerCard>): Observable<ApiResponse<ShortAnswerCard>> {
    return this.http.post<ApiResponse<ShortAnswerCard>>(`${this.base}/admin/${resourceId}/cards`, body);
  }

  updateCard(cid: string, body: Partial<ShortAnswerCard>): Observable<ApiResponse<ShortAnswerCard>> {
    return this.http.put<ApiResponse<ShortAnswerCard>>(`${this.base}/admin/cards/${cid}`, body);
  }

  deleteCard(cid: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/admin/cards/${cid}`);
  }
}
