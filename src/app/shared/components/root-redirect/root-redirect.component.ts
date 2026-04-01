import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { MATERIAL_MODULES } from '../../material';

@Component({
  selector: 'app-root-redirect',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES],
  templateUrl: './root-redirect.component.html',
  styleUrl: './root-redirect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RootRedirectComponent implements OnInit {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    // Route users to the correct landing page based on session state.
    const target = this.authService.isLoggedIn() ? '/surveys' : '/login';
    void this.router.navigate([target]);
  }
}
