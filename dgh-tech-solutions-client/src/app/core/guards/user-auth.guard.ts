import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';

export const userAuthGuard: CanActivateFn = (_route, state) => {
  const userAuth = inject(UserAuthService);
  const router   = inject(Router);

  if (userAuth.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
