import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { AdminSurveySummary, AdminUser } from '../../shared/models/admin.models';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  surveys: AdminSurveySummary[] = [];
  loading = false;
  errorMessage = '';
  selectedSurveyId: number | null = null;

  displayedColumns = ['employee', 'role', 'status', 'actions'];
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private readonly adminService: AdminService,
    private readonly snackBar: MatSnackBar,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Load users and survey list for admin actions.
    this.fetchData();
  }

  updateRole(user: AdminUser, role: AdminUser['role']): void {
    // Update the selected user's role.
    const updatedUser: AdminUser = { ...user, role };
    this.adminService.updateUser(updatedUser).subscribe({
      next: () => {
        user.role = role;
        this.snackBar.open('User role updated.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.snackBar.open('Unable to update user.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  unlockUser(user: AdminUser): void {
    // Unlock a locked user account.
    this.adminService.unlockUser(user.employee_id).subscribe({
      next: () => {
        user.locked = false;
        this.snackBar.open('Account unlocked.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.snackBar.open('Unable to unlock account.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  resetSurvey(user: AdminUser): void {
    // Reset survey completion for the selected user.
    if (!this.selectedSurveyId) {
      this.snackBar.open('Select a survey to reset.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.adminService.resetSurveyForUser(user.employee_id, this.selectedSurveyId).subscribe({
      next: () => {
        this.snackBar.open('Survey reseted successfully.', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Unable to reset survey.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private fetchData(): void {
    // Fetch users and surveys in parallel.
    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load users.';
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
    });

    this.adminService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys;
        this.selectedSurveyId = surveys[0]?.id ?? null;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load surveys.';
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }
}
