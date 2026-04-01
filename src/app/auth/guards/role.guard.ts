import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = () => {
  // Restrict access to admin roles only.
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUserProfile();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return true;
  }

  return router.createUrlTree(['/surveys']);
};
