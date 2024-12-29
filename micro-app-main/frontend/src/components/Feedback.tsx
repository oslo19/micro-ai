import React, { useState, useEffect, useRef } from 'react';
import { FeedbackState } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import katex from 'katex';

interface FeedbackProps {
  feedback: FeedbackState;
}

export function Feedback({ feedback }: FeedbackProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const answerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (feedback.type === 'error' && answerRef.current) {
      try {
        const latexMatch = feedback.message.match(/The correct answer is: (.*)/);
        if (latexMatch) {
          const answer = latexMatch[1];
          // Check if it's a LaTeX pattern
          if (answer.includes('\\')) {
            katex.render(answer, answerRef.current, {
              throwOnError: false,
              displayMode: true,
              trust: true
            });
          } else {
            // For non-LaTeX patterns (shapes, numbers, etc.)
            answerRef.current.textContent = answer;
          }
        }
      } catch (error) {
        console.error('Answer rendering error:', error);
        // Fallback to plain text
        if (answerRef.current) {
          answerRef.current.textContent = feedback.message.replace('The correct answer is: ', '');
        }
      }
    }
  }, [feedback]);

  if (!feedback.type) return null;

  const bgColor = feedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <div className={`mt-4 p-3 md:p-4 rounded-md text-white ${bgColor}`}>
      {feedback.message.includes('The correct answer is:') ? (
        <div className="flex flex-col gap-2">
          <p>The correct answer is:</p>
          <span ref={answerRef} className="bg-white/10 p-2 rounded"></span>
        </div>
      ) : (
        <p className="text-sm md:text-base">{feedback.message}</p>
      )}
      
      {feedback.explanation && (
        <>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-white/90 hover:text-white mt-2 text-sm"
          >
            {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
          
          {showExplanation && (
            <div className="mt-2 p-2 bg-white/10 rounded text-sm">
              {feedback.type === 'success' ? (
                <p>Great work! {feedback.explanation}</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Explanation:</p>
                  <p>{feedback.explanation}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}