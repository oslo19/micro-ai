export type PatternType = 'numeric' | 'symbolic' | 'logical';

export interface Pattern {
  sequence: string;
  answer: string;
  type: 'numeric' | 'symbolic' | 'logical';
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
  explanation?: string;
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