import React from 'react';
import { Pattern } from '../types';

interface PatternDisplayProps {
  pattern: Pattern | null;
}

export function PatternDisplay({ pattern }: PatternDisplayProps) {
  if (!pattern) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
        <p className="text-lg md:text-xl">Click "Generate" to start.</p>
      </div>
    );
  }

  const difficultyColor = {
    easy: 'text-emerald-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500'
  }[pattern.difficulty];

  return (
    <div className="mb-4">
      <div className="bg-gray-100 p-4 md:p-6 rounded-lg text-center">
        <div className="text-xl md:text-2xl font-bold mb-2 break-all">
          {pattern.sequence}
        </div>
        <div className="flex justify-center items-center gap-2 flex-wrap">
          <span className="text-gray-600 text-sm">{pattern.type}</span>
          <span className={`${difficultyColor} text-sm font-medium`}>
            {pattern.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
}