import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Routes that need the public user JWT rather than the admin JWT */
const USER_ROUTE_PATTERNS = [
  '/api/users/',
  '/api/payments/',
  '/api/cart',
];

function isUserRoute(url: string): boolean {
  if (USER_ROUTE_PATTERNS.some((p) => url.includes(p))) return true;
  // Resource content endpoints that enforce purchase access
  if (/\/api\/resources\/[^/]+\/(questions|cards)/.test(url)) return true;
  // Review routes — but NOT the admin sub-path
  if (url.includes('/api/reviews/') && !url.includes('/api/reviews/admin')) return true;
  // Progress routes — but NOT the admin sub-path
  if (url.includes('/api/progress/') && !url.includes('/api/progress/admin')) return true;
  return false;
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const adminToken = localStorage.getItem('dgh_token');
  const userToken  = localStorage.getItem('dgh_user_token');
  const router     = inject(Router);
  const auth       = inject(AuthService);

  const token = isUserRoute(req.url) ? userToken : adminToken;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Admin 401 — clear session and redirect to admin login
      if (
        err.status === 401 &&
        req.url.includes('/api/') &&
        !req.url.endsWith('/auth/login') &&
        router.url.startsWith('/admin')
      ) {
        localStorage.removeItem('dgh_token');
        localStorage.removeItem('dgh_admin');
        auth.currentAdmin.set(null);
        router.navigate(['/admin/login']);
      }
      // User 401 — clear user session and redirect to login
      if (
        err.status === 401 &&
        isUserRoute(req.url) &&
        !req.url.endsWith('/users/login') &&
        !req.url.endsWith('/users/register')
      ) {
        localStorage.removeItem('dgh_user_token');
        localStorage.removeItem('dgh_user');
      }
      return throwError(() => err);
    }),
  );
};
