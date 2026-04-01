import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/api/api-client.service';
import {
  AdminSurvey,
  AdminSurveyPayload,
  AdminSurveySummary,
  AdminUser,
  BelowThresholdStat,
  LowScoreCommentStat,
  QuestionAverageStat,
  QuestionRankingStat,
  ReportFilters,
  ReportResult
} from '../../shared/models/admin.models';
import { MockStoreService } from '../../shared/services/mock-store.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(
    private readonly apiClient: ApiClientService,
    private readonly mockStoreService: MockStoreService
  ) {}

  getSurveys(): Observable<AdminSurveySummary[]> {
    // Load surveys for admin management.
    if (environment.useMockApi) {
      const surveys = this.mockStoreService.getStore().surveys.map((survey) => ({
        id: survey.id,
        title: survey.title,
        start_at: survey.start_at,
        end_at: survey.end_at,
        question_count: survey.questions.length
      }));

      return of(surveys).pipe(delay(200));
    }

    return this.apiClient.get<AdminSurveySummary[]>('/api/admin/surveys');
  }

  getSurveyById(id: number): Observable<AdminSurvey> {
    // Fetch a single survey for editing.
    if (environment.useMockApi) {
      const survey = this.mockStoreService.getStore().surveys.find((item) => item.id === id);
      if (!survey) {
        return throwError(() => ({ status: 404 }));
      }

      return of(survey).pipe(delay(200));
    }

    return this.apiClient.get<AdminSurvey>(`/api/admin/surveys/${id}`);
  }

  saveSurvey(survey: AdminSurveyPayload): Observable<AdminSurvey> {
    // Create or update surveys for administration.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      const nextSurveyId = survey.id ?? Date.now();
      const normalizedSurvey: AdminSurvey = {
        id: nextSurveyId,
        title: survey.title,
        start_at: survey.start_at,
        end_at: survey.end_at,
        questions: survey.questions.map((question, index) => ({
          id: question.id ?? nextSurveyId * 100 + index + 1,
          text: question.text,
          threshold: question.threshold,
          options: question.options
        }))
      };

      const index = store.surveys.findIndex((item) => item.id === nextSurveyId);
      if (index >= 0) {
        store.surveys[index] = normalizedSurvey;
      } else {
        store.surveys.push(normalizedSurvey);
      }

      this.mockStoreService.saveStore(store);
      return of(normalizedSurvey).pipe(delay(200));
    }

    if (survey.id) {
      return this.apiClient.put<AdminSurvey>(`/api/admin/surveys/${survey.id}`, survey);
    }

    return this.apiClient.post<AdminSurvey>('/api/admin/surveys', survey);
  }

  deleteSurvey(id: number): Observable<void> {
    // Delete a survey from administration.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      store.surveys = store.surveys.filter((survey) => survey.id !== id);
      store.responses = store.responses.filter((response) => response.survey_id !== id);
      this.mockStoreService.saveStore(store);
      return of(void 0).pipe(delay(200));
    }

    // return this.apiClient.post<void>(`/api/admin/surveys/${id}/delete`, {});
    return this.apiClient.delete<void>(`/api/admin/surveys/delete/${id}`);
  }
  

  getUsers(): Observable<AdminUser[]> {
    // Load users for admin management.
    if (environment.useMockApi) {
      return of(this.mockStoreService.getStore().users).pipe(delay(200));
    }

    return this.apiClient.get<AdminUser[]>('/api/admin/users');
  }

  getResponseCount(): Observable<number> {
    // Load total submitted responses for dashboard counters.
    if (environment.useMockApi) {
      return of(this.mockStoreService.getStore().responses.length).pipe(delay(200));
    }

    return this.apiClient
      .get<{ count?: number; total?: number }>('/api/admin/responses/count')
      .pipe(map((payload) => payload.count ?? payload.total ?? 0));
  }

  updateUser(user: AdminUser): Observable<AdminUser> {
    // Update user role or status in the admin portal.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      const index = store.users.findIndex((item) => item.employee_id === user.employee_id);

      if (index >= 0) {
        store.users[index] = user;
        this.mockStoreService.saveStore(store);
      }

      return of(user).pipe(delay(200));
    }

    return this.apiClient.post<AdminUser>(`/api/admin/users/${user.employee_id}`, user);
  }

  unlockUser(employeeId: string): Observable<void> {
    // Unlock a user's account after lockout.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      const user = store.users.find((item) => item.employee_id === employeeId);
      if (user) {
        user.locked = false;
        this.mockStoreService.saveStore(store);
      }
      return of(void 0).pipe(delay(200));
    }

    return this.apiClient.post<void>(`/api/admin/users/${employeeId}/unlock`, {});
  }

  resetSurveyForUser(employeeId: string, surveyId: number): Observable<void> {
    // Reset survey completion for a specific user.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      store.responses = store.responses.filter(
        (response) => response.employee_id !== employeeId || response.survey_id !== surveyId
      );
      this.mockStoreService.saveStore(store);
      return of(void 0).pipe(delay(200));
    }

    return this.apiClient.post<void>(`/api/admin/surveys/${surveyId}/reset`, { employeeId });
  }

  getReport(filters: ReportFilters): Observable<ReportResult> {
    // Build a report summary for the selected survey.
    if (environment.useMockApi) {
      return of(this.buildMockReport(filters)).pipe(delay(200));
    }
    
    return this.apiClient.post<ReportResult>('/api/admin/reports', filters);
  }

  private buildMockReport(filters: ReportFilters): ReportResult {
    // Compute aggregate report tables from mock data.
    const store = this.mockStoreService.getStore();
    const survey = store.surveys.find((item) => item.id === filters.survey_id);

    if (!survey) {
      return {
        survey_id: filters.survey_id,
        survey_title: 'Unknown Survey',
        averageScorePerQuestion: [],
        belowThresholdStats: [],
        lowScoreComments: [],
        questionRanking: []
      };
    }

    const responses = store.responses.filter((response) => response.survey_id === survey.id);
    const filteredResponses = responses.filter((response) => {
      const submitted = new Date(response.submitted_at).getTime();
      const withinStart = filters.startDate
        ? submitted >= new Date(`${filters.startDate}T00:00:00`).getTime()
        : true;
      const withinEnd = filters.endDate
        ? submitted <= new Date(`${filters.endDate}T23:59:59.999`).getTime()
        : true;

      return withinStart && withinEnd;
    });

    const normalizedQuestionText = filters.questionText?.toLowerCase().trim();
    const filteredQuestions = normalizedQuestionText
      ? survey.questions.filter((question) => question.text.toLowerCase().includes(normalizedQuestionText))
      : survey.questions;

    const averageScorePerQuestion: QuestionAverageStat[] = filteredQuestions.map((question) => {
      const scores = filteredResponses
        .flatMap((response) => response.answers)
        .filter((answer) => answer.question_id === question.id)
        .map((answer) => answer.score);

      const averageScore = scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      return {
        question_text: question.text,
        total_responses: scores.length,
        average_score: Number(averageScore.toFixed(2))
      };
    });

    const belowThresholdStats: BelowThresholdStat[] = filteredQuestions.map((question) => {
      const answers = filteredResponses
        .flatMap((response) => response.answers)
        .filter((answer) => answer.question_id === question.id);
      const belowThresholdCount = answers.filter((answer) => answer.score < question.threshold).length;
      const totalResponses = answers.length;
      const percentage = totalResponses ? (belowThresholdCount / totalResponses) * 100 : 0;

      return {
        question_text: question.text,
        total_responses: totalResponses,
        responses_below_threshold: belowThresholdCount,
        percentage_below_threshold: Number(percentage.toFixed(2))
      };
    });

    const lowScoreComments: LowScoreCommentStat[] = filteredQuestions.flatMap((question) =>
      filteredResponses
        .flatMap((response) => response.answers)
        .filter((answer) => answer.question_id === question.id && answer.score < question.threshold)
        .filter((answer) => Boolean(answer.comment?.trim()))
        .map((answer) => ({
          question_text: question.text,
          score_given: answer.score,
          user_comment: answer.comment?.trim() ?? ''
        }))
    );

    const questionRanking: QuestionRankingStat[] = [...averageScorePerQuestion]
      .sort((left, right) => {
        if (left.total_responses === 0 && right.total_responses === 0) {
          return left.question_text.localeCompare(right.question_text);
        }
        if (left.total_responses === 0) {
          return 1;
        }
        if (right.total_responses === 0) {
          return -1;
        }
        return right.average_score - left.average_score;
      })
      .map((item, index) => ({
        rank: index + 1,
        question_text: item.question_text,
        average_score: item.average_score
      }));

    return {
      survey_id: survey.id,
      survey_title: survey.title,
      averageScorePerQuestion,
      belowThresholdStats,
      lowScoreComments,
      questionRanking
    };
  }
}
