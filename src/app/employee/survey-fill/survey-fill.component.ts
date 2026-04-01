import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { MATERIAL_MODULES } from '../../shared/material';
import { SurveyDetail, SurveySubmitPayload } from '../../shared/models/survey.models';
import { SurveyService } from '../services/survey.service';

interface QuestionFormGroup {
  score: FormControl<number | null>;
  comment: FormControl<string | null>;
}

@Component({
  selector: 'app-survey-fill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, ...MATERIAL_MODULES],
  templateUrl: './survey-fill.component.html',
  styleUrl: './survey-fill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurveyFillComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  survey: SurveyDetail | null = null;
  loading = false;
  submitLoading = false;
  errorMessage = '';
  isAvailable = true;
  isCompleted = false;

  readonly form = this.formBuilder.group({
    questions: this.formBuilder.array<FormGroup<QuestionFormGroup>>([])
  });

  ngOnInit(): void {
    // Load the survey and initialize the reactive form.
    const surveyId = Number(this.route.snapshot.paramMap.get('id'));
    if (!surveyId) {
      this.errorMessage = 'Invalid survey link.';
      return;
    }

    this.loading = true;
    this.changeDetectorRef.markForCheck();

    this.surveyService
      .getSurveyById(surveyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (survey) => {
          this.survey = survey;
          this.loading = false;
          this.evaluateAvailability(survey);
          this.buildForm(survey);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Unable to load survey details.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    // Tear down subscriptions to prevent memory leaks.
    this.destroy$.next();
    this.destroy$.complete();
  }

  get questionsArray(): FormArray<FormGroup<QuestionFormGroup>> {
    // Provide typed access to the question controls.
    return this.form.controls.questions;
  }

  get progressIndex(): number {
    // Display progress based on the first invalid/unanswered question.
    if (!this.survey || this.questionsArray.length === 0) {
      return 0;
    }

    const invalidIndex = this.questionsArray.controls.findIndex((group) => group.invalid);
    return invalidIndex >= 0 ? invalidIndex + 1 : this.survey.questions.length;
  }

  getQuestionGroup(index: number): FormGroup<QuestionFormGroup> | null {
    // Provide the form group for a specific question index.
    return (this.questionsArray.at(index) as FormGroup<QuestionFormGroup>) ?? null;
  }

  submit(): void {
    // Submit the survey responses once validation passes.
    if (!this.survey || this.form.invalid || !this.isAvailable || this.isCompleted) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidQuestion();
      return;
    }

    this.submitLoading = true;
    this.changeDetectorRef.markForCheck();
    const payload = this.buildPayload();

    this.surveyService.submitSurveyResponse(this.survey.id, payload).subscribe({
      next: () => {
        this.submitLoading = false;
        this.snackBar.open('Thank you – your survey has been submitted.', 'Dismiss', { duration: 4000 });
        void this.router.navigate(['/surveys']);
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.submitLoading = false;

        if (error?.status === 409) {
          this.snackBar.open('Already completed.', 'Dismiss', { duration: 4000 });
          this.changeDetectorRef.markForCheck();
          return;
        }

        if (error?.status === 422) {
          this.applyServerErrors(error?.error?.errors ?? {});
          this.focusFirstInvalidQuestion();
          this.changeDetectorRef.markForCheck();
          return;
        }

        this.snackBar.open('Submission failed. Please try again.', 'Dismiss', { duration: 4000 });
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  requiresComment(index: number): boolean {
    // Determine whether the comment field is required for the given question.
    if (!this.survey) {
      return false;
    }

    const group = this.questionsArray.at(index);
    const score = group?.controls.score.value;

    return score !== null && score < this.survey.questions[index].threshold;
  }

  private buildForm(survey: SurveyDetail): void {
    // Create form controls for each survey question.
    const questionGroups = survey.questions.map((question) => {
      const group = this.formBuilder.group<QuestionFormGroup>({
        score: this.formBuilder.control<number | null>(null, Validators.required),
        comment: this.formBuilder.control<string | null>('')
      });

      this.bindCommentValidator(group, question.threshold);
      return group;
    });

    this.form.setControl('questions', this.formBuilder.array(questionGroups));

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.changeDetectorRef.markForCheck();
    });

    if (!this.isAvailable || this.isCompleted) {
      this.form.disable();
    }
  }

  private bindCommentValidator(group: FormGroup<QuestionFormGroup>, threshold: number): void {
    // Toggle comment validation based on the selected score.
    const scoreControl = group.controls.score;
    const commentControl = group.controls.comment;

    const updateValidators = (score: number | null): void => {
      if (score !== null && score < threshold) {
        commentControl.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        commentControl.clearValidators();
      }
      commentControl.updateValueAndValidity({ emitEvent: false });
    };

    updateValidators(scoreControl.value);
    scoreControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(updateValidators);
  }

  private buildPayload(): SurveySubmitPayload {
    // Map form values into the API payload shape.
    const answers = this.questionsArray.controls.map((group, index) => {
      const score = group.controls.score.value ?? 0;
      const comment = group.controls.comment.value ?? undefined;

      return {
        question_id: this.survey?.questions[index].id ?? 0,
        score,
        comment: comment?.trim() ? comment : undefined
      };
    });

    return { answers };
  }

  private evaluateAvailability(survey: SurveyDetail): void {
    // Calculate availability based on survey start/end dates and completion state.
    const now = new Date();
    const start = new Date(survey.start_at);
    const end = new Date(survey.end_at);

    this.isAvailable = now >= start && now <= end;
    this.isCompleted = survey.already_completed;
  }

  private focusFirstInvalidQuestion(): void {
    // Scroll to the first invalid question for faster correction.
    const invalidIndex = this.questionsArray.controls.findIndex((group) => group.invalid);
    if (invalidIndex >= 0) {
      const target = document.getElementById(`question-${invalidIndex + 1}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private applyServerErrors(errors: Record<string, string[]>): void {
    // Apply backend validation errors to matching form controls.
    Object.keys(errors).forEach((key) => {
      const match = key.match(/^answers\.(\d+)\.(score|comment)$/);
      if (!match) {
        return;
      }

      const index = Number(match[1]);
      const controlName = match[2] as keyof QuestionFormGroup;
      const group = this.questionsArray.at(index);

      if (group) {
        group.controls[controlName].setErrors({ server: errors[key]?.[0] ?? true });
      }
    });
  }
}
