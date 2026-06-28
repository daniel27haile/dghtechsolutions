import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserAuthResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UserAuthService {
  private readonly base = `${environment.apiUrl}/users`;

  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn  = computed(() => !!this.currentUser());

  constructor(private http: HttpClient) {}

  register(name: string, email: string, password: string): Observable<UserAuthResponse> {
    return this.http.post<UserAuthResponse>(`${this.base}/register`, { name, email, password }).pipe(
      tap((res) => this.persist(res))
    );
  }

  login(email: string, password: string): Observable<UserAuthResponse> {
    return this.http.post<UserAuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap((res) => this.persist(res))
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.base}/me`);
  }

  logout(): void {
    localStorage.removeItem('dgh_user_token');
    localStorage.removeItem('dgh_user');
    this.currentUser.set(null);
  }

  private persist(res: UserAuthResponse): void {
    localStorage.setItem('dgh_user_token', res.token);
    localStorage.setItem('dgh_user', JSON.stringify(res.data));
    this.currentUser.set(res.data);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem('dgh_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  }
}
