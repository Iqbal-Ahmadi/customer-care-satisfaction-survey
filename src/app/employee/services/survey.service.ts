import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/api/api-client.service';
import { SurveyDetail, SurveySubmitPayload, SurveySummary } from '../../shared/models/survey.models';
import { MockStoreService } from '../../shared/services/mock-store.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  constructor(
    private readonly apiClient: ApiClientService,
    private readonly mockStoreService: MockStoreService,
    private readonly authService: AuthService
  ) { }

  getActiveSurveys(): Observable<SurveySummary[]> {
    // Fetch the list of active surveys for the employee.
    if (environment.useMockApi) {
      const now = new Date();
      const surveys = this.mockStoreService
        .getStore()
        .surveys.filter((survey) => {
          const start = new Date(survey.start_at);
          const end = new Date(survey.end_at);
          return now >= start && now <= end;
        })
        .map((survey) => ({
          id: survey.id,
          title: survey.title,
          start_at: survey.start_at,
          end_at: survey.end_at
        }));

      return of(surveys).pipe(delay(200));
    }

    return this.apiClient.get<SurveySummary[]>('/api/surveys/active');
  }

  getSurveyById(id: number): Observable<SurveyDetail> {
    // Retrieve a survey with its questions and metadata.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      const survey = store.surveys.find((item) => item.id === id);

      if (!survey) {
        return throwError(() => ({ status: 404 }));
      }

      const user = this.authService.getUserProfile();
      const alreadyCompleted = store.responses.some(
        (response) => response.survey_id === id && response.employee_id === user?.employee_id
      );

      const detail: SurveyDetail = {
        id: survey.id,
        title: survey.title,
        start_at: survey.start_at,
        end_at: survey.end_at,
        already_completed: alreadyCompleted,
        questions: survey.questions
      };

      return of(detail).pipe(delay(200));
    }

    return this.apiClient.get<SurveyDetail>(`api/surveys/${id}`);
  }

  submitSurveyResponse(id: number, payload: SurveySubmitPayload): Observable<void> {
    // Submit employee responses for the specified survey.
    if (environment.useMockApi) {
      const store = this.mockStoreService.getStore();
      const survey = store.surveys.find((item) => item.id === id);
      const user = this.authService.getUserProfile();

      if (!survey || !user) {
        return throwError(() => ({ status: 404 }));
      }

      const alreadyCompleted = store.responses.some(
        (response) => response.survey_id === id && response.employee_id === user.employee_id
      );

      if (alreadyCompleted) {
        return throwError(() => ({ status: 409 }));
      }

      store.responses.push({
        id: Date.now(),
        survey_id: id,
        survey_title: survey.title,
        employee_id: user.employee_id,
        employee_name: user.name,
        submitted_at: new Date().toISOString(),
        answers: payload.answers
      });

      this.mockStoreService.saveStore(store);
      return of(void 0).pipe(delay(300));
    }

    return this.apiClient.post<void>(`/api/surveys/${id}/responses`, payload);
  }
}
