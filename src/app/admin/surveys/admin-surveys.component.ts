import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AdminSurveySummary } from '../../shared/models/admin.models';
import { AdminService } from '../services/admin.service';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-admin-surveys',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ...MATERIAL_MODULES],
  templateUrl: './admin-surveys.component.html',
  styleUrl: './admin-surveys.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSurveysComponent implements OnInit {
  surveys: AdminSurveySummary[] = [];
  loading = false;
  errorMessage = '';

  displayedColumns = ['title', 'dates', 'questions', 'actions'];
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Load surveys for management.
    this.fetchSurveys();
  }

  openSurvey(survey: AdminSurveySummary): void {
    // Navigate to the survey editor view.
    void this.router.navigate(['/admin/surveys', survey.id]);
  }

  deleteSurvey(survey: AdminSurveySummary): void {
    // Remove the survey after confirmation.
    const confirmed = window.confirm(`Delete "${survey.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteSurvey(survey.id).subscribe({
      next: () => {
        this.surveys = this.surveys.filter((item) => item.id !== survey.id);
        this.snackBar.open('Survey deleted.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.snackBar.open('Unable to delete survey.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private fetchSurveys(): void {
    // Retrieve surveys from the service with loading state handling.
    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.adminService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys;
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
