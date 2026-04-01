import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminSurvey, AdminSurveyPayload } from '../../shared/models/admin.models';
import { SurveyOption, SurveyQuestion } from '../../shared/models/survey.models';
import { AdminService } from '../services/admin.service';
import { MATERIAL_MODULES } from '../../shared/material';

interface SurveyFormGroup {
  title: FormControl<string>;
  start_at: FormControl<string>;
  end_at: FormControl<string>;
  questions: FormArray<FormGroup<QuestionFormGroup>>;
}

interface QuestionFormGroup {
  id: FormControl<number | null>;
  text: FormControl<string>;
  threshold: FormControl<number>;
  options: FormArray<FormGroup<OptionFormGroup>>;
}

interface OptionFormGroup {
  score: FormControl<number>;
  label: FormControl<string>;
}

@Component({
  selector: 'app-survey-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ...MATERIAL_MODULES],
  templateUrl: './survey-editor.component.html',
  styleUrl: './survey-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurveyEditorComponent implements OnInit {
  form!: FormGroup<SurveyFormGroup>;
  loading = false;
  saving = false;
  surveyId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly adminService: AdminService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize the editor form based on route context.
    const param = this.route.snapshot.paramMap.get('id');
    this.surveyId = param && param !== 'new' ? Number(param) : null;
    this.form = this.buildForm();

    if (this.surveyId) {
      this.loadSurvey(this.surveyId);
    } else {
      this.addQuestion();
      this.changeDetectorRef.markForCheck();
    }
  }

  get questions(): FormArray<FormGroup<QuestionFormGroup>> {
    // Provide quick access to the question list.
    return this.form.controls.questions;
  }

  getOptions(index: number): FormArray<FormGroup<OptionFormGroup>> {
    // Access the options array for a specific question.
    return this.questions.at(index).controls.options;
  }

  addQuestion(): void {
    // Append a new question to the survey.
    this.questions.push(this.buildQuestionGroup());
    this.changeDetectorRef.markForCheck();
  }

  removeQuestion(index: number): void {
    // Remove a question from the survey.
    this.questions.removeAt(index);
    this.changeDetectorRef.markForCheck();
  }

  addOption(questionIndex: number): void {
    // Append a new option to a question.
    const options = this.getOptions(questionIndex);
    const nextScore = options.length + 1;
    options.push(this.buildOptionGroup({ score: nextScore, label: `${nextScore}` }));
    this.changeDetectorRef.markForCheck();
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    // Remove an option from a question.
    const options = this.getOptions(questionIndex);
    options.removeAt(optionIndex);
    this.changeDetectorRef.markForCheck();
  }

  save(): void {
    // Persist survey updates through the admin service.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildSurveyPayload();
    this.saving = true;
    this.changeDetectorRef.markForCheck();

    this.adminService.saveSurvey(payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Survey saved successfully.', 'Dismiss', { duration: 3000 });
        void this.router.navigate(['/admin/surveys']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Unable to save survey.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private loadSurvey(id: number): void {
    // Load survey data into the editor form.
    this.loading = true;
    this.changeDetectorRef.markForCheck();

    this.adminService.getSurveyById(id).subscribe({
      next: (survey) => {
        this.loading = false;
        this.patchForm(survey);
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Survey not found.', 'Dismiss', { duration: 3000 });
        void this.router.navigate(['/admin/surveys']);
      }
    });
  }

  private buildForm(): FormGroup<SurveyFormGroup> {
    // Build the reactive form structure for survey editing.
    return this.formBuilder.group<SurveyFormGroup>({
      title: this.formBuilder.control('', { nonNullable: true, validators: [Validators.required] }),
      start_at: this.formBuilder.control('', { nonNullable: true, validators: [Validators.required] }),
      end_at: this.formBuilder.control('', { nonNullable: true, validators: [Validators.required] }),
      questions: this.formBuilder.array<FormGroup<QuestionFormGroup>>([])
    });
  }

  private buildQuestionGroup(question?: SurveyQuestion): FormGroup<QuestionFormGroup> {
    // Create a question group with options.
    const optionGroups = (question?.options ?? this.buildDefaultOptions()).map((option) =>
      this.buildOptionGroup(option)
    );

    return this.formBuilder.group<QuestionFormGroup>({
      id: this.formBuilder.control(question?.id ?? null),
      text: this.formBuilder.control(question?.text ?? '', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      threshold: this.formBuilder.control(question?.threshold ?? 3, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)]
      }),
      options: this.formBuilder.array<FormGroup<OptionFormGroup>>(optionGroups)
    });
  }

  private buildOptionGroup(option: SurveyOption): FormGroup<OptionFormGroup> {
    // Create an option group for a question.
    return this.formBuilder.group<OptionFormGroup>({
      score: this.formBuilder.control(option.score, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)]
      }),
      label: this.formBuilder.control(option.label, {
        nonNullable: true,
        validators: [Validators.required]
      })
    });
  }

  private buildDefaultOptions(): SurveyOption[] {
    // Generate default 1-5 options for new questions.
    return [1, 2, 3, 4, 5].map((score) => ({ score, label: `${score}` }));
  }

  private patchForm(survey: AdminSurvey): void {
    // Populate the form controls with survey data.
    this.form.patchValue({
      title: survey.title,
      start_at: this.toInputDateTime(survey.start_at),
      end_at: this.toInputDateTime(survey.end_at)
    });

    const questionGroups = survey.questions.map((question) => this.buildQuestionGroup(question));
    this.form.setControl('questions', this.formBuilder.array(questionGroups));
  }

  private buildSurveyPayload(): AdminSurveyPayload {
    // Convert form values into a survey payload.
    const formValue = this.form.getRawValue();

    const questions = formValue.questions.map((question) => {
      const options = question.options.map((option) => ({
        score: option.score,
        label: option.label
      }));

      const payloadQuestion: AdminSurveyPayload['questions'][number] = {
        text: question.text,
        threshold: question.threshold,
        options
      };

      if (question.id) {
        payloadQuestion.id = question.id;
      }

      return payloadQuestion;
    });

    const payload: AdminSurveyPayload = {
      title: formValue.title,
      start_at: this.fromInputDateTime(formValue.start_at),
      end_at: this.fromInputDateTime(formValue.end_at),
      questions
    };

    if (this.surveyId) {
      payload.id = this.surveyId;
    }

    return payload;
  }

  private toInputDateTime(value: string): string {
    // Convert ISO date to datetime-local string.
    const date = new Date(value);
    return date.toISOString().slice(0, 16);
  }

  private fromInputDateTime(value: string): string {
    // Convert datetime-local string to ISO.
    return new Date(value).toISOString();
  }
}
