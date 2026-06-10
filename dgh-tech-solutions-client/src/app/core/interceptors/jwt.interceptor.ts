import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token  = localStorage.getItem('dgh_token');
  const router = inject(Router);
  const auth   = inject(AuthService);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // On 401 from a protected API endpoint, clear the stale session and
      // redirect to admin login — but ONLY when currently on an admin route.
      // Public pages must never be redirected to the admin login screen.
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
      return throwError(() => err);
    }),
  );
};
