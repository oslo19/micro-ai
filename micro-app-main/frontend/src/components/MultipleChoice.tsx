import React from 'react';
import { Pattern } from '../types';

interface MultipleChoiceProps {
  pattern: Pattern;
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  disabled: boolean;
}

export function MultipleChoice({ pattern, selectedAnswer, onSelect, disabled }: MultipleChoiceProps) {
  if (pattern.type === 'numeric') return null;

  // Generate multiple choice options including the correct answer
  const generateOptions = () => {
    const correctAnswer = pattern.answer;
    let options = [correctAnswer];

    // Generate 3 different incorrect but plausible options
    while (options.length < 4) {
      let option = '';
      
      if (pattern.type === 'symbolic') {
        // For symbolic patterns, modify symbols slightly
        option = correctAnswer.split('')
          .map(char => {
            const random = Math.random();
            if (random < 0.5) return char;
            return ['□', '○', '△', '◇', '♢', '♡'][Math.floor(Math.random() * 6)];
          })
          .join('');
      } else {
        // For logical patterns, modify letters or words
        option = correctAnswer.split('')
          .map(char => {
            const random = Math.random();
            if (random < 0.5) return char;
            return String.fromCharCode(97 + Math.floor(Math.random() * 26));
          })
          .join('');
      }

      if (!options.includes(option)) {
        options.push(option);
      }
    }

    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
  };

  const options = generateOptions();

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={`p-3 rounded-md border-2 transition-colors
            ${selectedAnswer === option 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
} 