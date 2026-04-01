import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { merge, Subject, timer, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private lastActivity = Date.now();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  start(): void {
    // Track user activity to implement idle logout.
    const activityEvents$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    );

    activityEvents$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastActivity = Date.now();
    });

    timer(0, 60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.evaluateIdleTimeout());
  }

  ngOnDestroy(): void {
    // Clean up event subscriptions when the service is destroyed.
    this.destroy$.next();
    this.destroy$.complete();
  }

  private evaluateIdleTimeout(): void {
    // Logout the user after the configured idle timeout.
    if (!this.authService.isLoggedIn()) {
      return;
    }

    const idleLimitMs = environment.idleTimeoutMinutes * 60 * 1000;
    const isIdle = Date.now() - this.lastActivity >= idleLimitMs;

    if (isIdle) {
      this.authService.clearSession();
      this.snackBar.open('You have been logged out due to inactivity.', 'Dismiss', { duration: 4000 });
      void this.router.navigate(['/login']);
      this.lastActivity = Date.now();
    }
  }
}
