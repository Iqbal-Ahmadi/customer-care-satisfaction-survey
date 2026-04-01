import { Injectable } from '@angular/core';
import { AdminSurvey, AdminUser, SurveyResponse } from '../models/admin.models';
import { SurveyOption, SurveyQuestion } from '../models/survey.models';

interface MockStore {
  surveys: AdminSurvey[];
  users: AdminUser[];
  responses: SurveyResponse[];
}

@Injectable({ providedIn: 'root' })
export class MockStoreService {
  private readonly storageKey = 'mock_employee_survey_store';

  getStore(): MockStore {
    // Load the stored mock data or initialize defaults.
    const raw = sessionStorage.getItem(this.storageKey);
    if (raw) {
      try {
        return JSON.parse(raw) as MockStore;
      } catch {
        return this.seedStore();
      }
    }

    return this.seedStore();
  }

  saveStore(store: MockStore): void {
    // Persist mock data updates to session storage.
    sessionStorage.setItem(this.storageKey, JSON.stringify(store));
  }

  resetStore(): void {
    // Reset mock data to the default seed.
    this.saveStore(this.seedStore());
  }

  private seedStore(): MockStore {
    // Create the default mock data set for surveys, users, and responses.
    const defaultOptions = this.buildDefaultOptions();

    const surveys: AdminSurvey[] = [
      {
        id: 10,
        title: 'Customer Care Representatives Survey',
        start_at: '2026-01-01T00:00:00Z',
        end_at: '2026-12-31T23:59:59Z',
        questions: this.buildBaseQuestions(defaultOptions)
      },
      {
        id: 11,
        title: 'Quality Assurance Pulse Check',
        start_at: '2026-01-10T00:00:00Z',
        end_at: '2026-12-31T23:59:59Z',
        questions: this.buildAdditionalQuestions(defaultOptions)
      }
    ];

    const users: AdminUser[] = [
      { employee_id: 'EMP-001', name: 'Aisha Kareem', role: 'USER', locked: false },
      { employee_id: 'EMP-002', name: 'Omar Khalid', role: 'USER', locked: false },
      { employee_id: 'EMP-100', name: 'Lina Admin', role: 'ADMIN', locked: false },
      { employee_id: 'EMP-999', name: 'System Super', role: 'SUPER_ADMIN', locked: false }
    ];

    const responses: SurveyResponse[] = [];

    const store: MockStore = { surveys, users, responses };
    this.saveStore(store);
    return store;
  }

  private buildDefaultOptions(): SurveyOption[] {
    // Provide a 1-5 Likert scale for all default questions.
    return [
      { score: 1, label: '1' },
      { score: 2, label: '2' },
      { score: 3, label: '3' },
      { score: 4, label: '4' },
      { score: 5, label: '5' }
    ];
  }

  private buildBaseQuestions(options: SurveyOption[]): SurveyQuestion[] {
    // Map the provided survey questions into the mock survey.
    return [
      {
        id: 101,
        text: 'How would you rate the behavior and attitude of HPL Team Leaders?',
        threshold: 3,
        options
      },
      {
        id: 102,
        text: 'How satisfied are you with the communication and feedback provided by HPL Team Leaders?',
        threshold: 3,
        options
      },
      {
        id: 103,
        text: 'How would you rate the facilities provided by HPL, such as tea, sugar, milk, water, coffee, and tissue paper?',
        threshold: 3,
        options
      },
      {
        id: 104,
        text: 'How would you rate the cleanliness and maintenance of the workplace such as washrooms, air conditioning and ventilation?',
        threshold: 3,
        options
      },
      {
        id: 105,
        text: 'How would you rate the comfort and set-up of the environment such as tea room, chairs and refreshment area?',
        threshold: 3,
        options
      },
      {
        id: 106,
        text: 'How would you rate the IT equipment provided by HPL, such as mouse, keyboard, headphones, and PCs?',
        threshold: 3,
        options
      },
      {
        id: 107,
        text: 'Do you feel your IT-related concerns are taken seriously and resolved appropriately?',
        threshold: 3,
        options
      },
      {
        id: 108,
        text: 'Does the HPL IT support team solve the technical issues of computers in a timely manner and maintain them efficiently operational?',
        threshold: 3,
        options
      },
      {
        id: 109,
        text: 'How satisfied are you with the training and onboarding provided by HPL?',
        threshold: 3,
        options
      },
      {
        id: 110,
        text: 'How well do you feel your workload is managed day to day?',
        threshold: 3,
        options
      },
      {
        id: 111,
        text: 'How satisfied are you with teamwork and collaboration within the project?',
        threshold: 3,
        options
      },
      {
        id: 112,
        text: 'How confident are you about your career growth opportunities with HPL?',
        threshold: 3,
        options
      }
    ];
  }

  private buildAdditionalQuestions(options: SurveyOption[]): SurveyQuestion[] {
    // Provide a second survey with a smaller set of questions.
    return [
      {
        id: 201,
        text: 'How clear are the quality standards communicated to you?',
        threshold: 3,
        options
      },
      {
        id: 202,
        text: 'How effective are the coaching sessions you receive?',
        threshold: 3,
        options
      },
      {
        id: 203,
        text: 'How satisfied are you with your performance feedback cycle?',
        threshold: 3,
        options
      },
      {
        id: 204,
        text: 'How would you rate the overall quality monitoring process?',
        threshold: 3,
        options
      },
      {
        id: 205,
        text: 'How satisfied are you with the tools available for quality assurance tasks?',
        threshold: 3,
        options
      }
    ];
  }
}
