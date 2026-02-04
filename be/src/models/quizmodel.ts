/**
 * DB row for a single question.
 */
export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

/**
 * What the client sees (no correct answer).
 */
export interface QuestionResponse {
  id: number;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

/** A single submitted answer. */
export interface AnswerSubmission {
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D';
}

/** A full submission with multiple answers. */
export interface QuizSubmission {
  answers: AnswerSubmission[];
}

/** Score summary, with optional per-question breakdown. */
export interface QuizResult {
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  details?: {
    question_id: number;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }[];
}

// --- Users & Attempts ---

export interface UserInfo {
  username: string;
  email: string;
}

export interface User extends UserInfo {
  id: number;
  created_at: string;
}

export interface AttemptRecord {
  id: number;
  user_id: number;
  quiz_id: number;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  created_at: string;
}