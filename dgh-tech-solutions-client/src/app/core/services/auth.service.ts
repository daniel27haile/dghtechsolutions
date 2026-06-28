import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, LoginResponse } from '../models';

const TOKEN_KEY = 'dgh_token';
const USER_KEY  = 'dgh_admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentAdmin = signal<AdminUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => {
        if (res.success) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.admin));
          this.currentAdmin.set(res.admin);
        }
      }));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentAdmin.set(null);
    this.router.navigate(['/admin/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getMe(): Observable<{ success: boolean; admin: AdminUser }> {
    return this.http
      .get<{ success: boolean; admin: AdminUser }>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((res) => this.currentAdmin.set(res.admin)));
  }

  updateProfile(displayName: string): Observable<{ success: boolean; admin: AdminUser }> {
    return this.http
      .patch<{ success: boolean; admin: AdminUser }>(`${environment.apiUrl}/auth/profile`, { displayName })
      .pipe(tap((res) => {
        if (res.success) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.admin));
          this.currentAdmin.set(res.admin);
        }
      }));
  }

  changePassword(current: string, next: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${environment.apiUrl}/auth/change-password`,
      { currentPassword: current, newPassword: next }
    );
  }

  private loadUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch { return null; }
  }
}
