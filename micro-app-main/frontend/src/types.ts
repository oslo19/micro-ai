export type PatternType = 'numeric' | 'symbolic' | 'logical';

export interface Pattern {
  sequence: string;
  answer: string;
  hint: string;
  explanation: string;
  type: PatternType;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FeedbackState {
  message: string;
  type: 'success' | 'error' | null;
  explanation?: string;
}

export interface AIHint {
  hint: string;
  confidence: number;
  reasoning: string;
}