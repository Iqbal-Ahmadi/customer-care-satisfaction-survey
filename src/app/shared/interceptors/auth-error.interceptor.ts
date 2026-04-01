import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

let isHandlingUnauthorized = false;

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Handle expired sessions globally while allowing login errors to be handled locally.
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error?.status === 401 && !req.url.includes('/api/auth/login')) {
        if (!isHandlingUnauthorized) {
          isHandlingUnauthorized = true;
          authService.clearSession();
          snackBar.open('Session expired. Please log in again.', 'Dismiss', { duration: 4000 });

          void router.navigate(['/login']).finally(() => {
            isHandlingUnauthorized = false;
          });
        }
      }

      return throwError(() => error);
    })
  );
};
