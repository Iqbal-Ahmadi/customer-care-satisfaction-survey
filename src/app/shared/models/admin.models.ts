import { UserRole } from './auth.models';
import { SurveyQuestion } from './survey.models';

export interface AdminSurveySummary {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  question_count: number;
}

export interface AdminSurvey {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  questions: SurveyQuestion[];
}

export interface AdminSurveyQuestionPayload {
  id?: number;
  text: string;
  threshold: number;
  options: {
    score: number;
    label: string;
  }[];
}

export interface AdminSurveyPayload {
  id?: number;
  title: string;
  start_at: string;
  end_at: string;
  questions: AdminSurveyQuestionPayload[];
}

export interface AdminUser {
  employee_id: string;
  name: string;
  role: UserRole;
  locked: boolean;
}

export interface SurveyResponseAnswer {
  question_id: number;
  score: number;
  comment?: string;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  survey_title: string;
  employee_id: string;
  employee_name: string;
  submitted_at: string;
  answers: SurveyResponseAnswer[];
}

export interface QuestionAverageStat {
  question_text: string;
  total_responses: number;
  average_score: number;
}

export interface BelowThresholdStat {
  question_text: string;
  total_responses: number;
  responses_below_threshold: number;
  percentage_below_threshold: number;
}

export interface LowScoreCommentStat {
  question_text: string;
  score_given: number;
  user_comment: string;
}

export interface QuestionRankingStat {
  rank: number;
  question_text: string;
  average_score: number;
}

export interface ReportFilters {
  survey_id: number;
  startDate?: string;
  endDate?: string;
  questionText?: string;
}

export interface ReportResult {
  survey_id: number;
  survey_title: string;
  averageScorePerQuestion: QuestionAverageStat[];
  belowThresholdStats: BelowThresholdStat[];
  lowScoreComments: LowScoreCommentStat[];
  questionRanking: QuestionRankingStat[];
}
