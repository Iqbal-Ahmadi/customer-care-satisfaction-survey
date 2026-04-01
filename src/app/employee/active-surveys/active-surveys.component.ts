import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '../../shared/material';
import { SurveySummary } from '../../shared/models/survey.models';
import { SurveyService } from '../services/survey.service';

@Component({
  selector: 'app-active-surveys',
  standalone: true,
  imports: [CommonModule, DatePipe, ...MATERIAL_MODULES],
  templateUrl: './active-surveys.component.html',
  styleUrl: './active-surveys.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveSurveysComponent implements OnInit {
  surveys: SurveySummary[] = [];
  loading = false;
  errorMessage = '';

  readonly skeletonItems = Array.from({ length: 4 });
  constructor(
    private readonly surveyService: SurveyService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load active surveys on page entry.
    this.fetchSurveys();
  }

  openSurvey(survey: SurveySummary): void {
    // Navigate to the survey detail page.
    void this.router.navigate(['/surveys', survey.id]);
  }

  private fetchSurveys(): void {
    // Retrieve active surveys and handle loading state.
    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.surveyService.getActiveSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load surveys. Please try again.';
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }
}
