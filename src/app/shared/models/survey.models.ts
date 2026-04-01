export interface SurveySummary {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
}

export interface SurveyOption {
  score: number;
  label: string;
}

export interface SurveyQuestion {
  id: number;
  text: string;
  threshold: number;
  options: SurveyOption[];
}

export interface SurveyDetail extends SurveySummary {
  already_completed: boolean;
  questions: SurveyQuestion[];
}

export interface SurveyAnswerPayload {
  question_id: number;
  score: number;
  comment?: string;
}

export interface SurveySubmitPayload {
  answers: SurveyAnswerPayload[];
}