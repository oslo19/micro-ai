import React from 'react';
import { FeedbackState } from '../types';

interface FeedbackProps {
  feedback: FeedbackState;
}

export function Feedback({ feedback }: FeedbackProps) {
  if (!feedback.type) return null;

  const bgColor = feedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <div className={`mt-4 p-3 md:p-4 rounded-md text-white ${bgColor}`}>
      <p className="text-sm md:text-base">{feedback.message}</p>
      {feedback.explanation && (
        <p className="text-xs md:text-sm mt-1 text-white/90">{feedback.explanation}</p>
      )}
    </div>
  );
}