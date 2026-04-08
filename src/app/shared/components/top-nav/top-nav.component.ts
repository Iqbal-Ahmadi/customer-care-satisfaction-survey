import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { MATERIAL_MODULES } from '../../material';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, ...MATERIAL_MODULES],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopNavComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user$ = this.authService.user$;

  logout(): void {
    // Clear session data and return the user to the login screen.
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
