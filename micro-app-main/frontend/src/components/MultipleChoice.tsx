import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import katex from 'katex';

interface MultipleChoiceProps {
  pattern: Pattern;
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  disabled: boolean;
  submitted: boolean;
}

export function MultipleChoice({ pattern, selectedAnswer, onSelect, disabled, submitted }: MultipleChoiceProps) {
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const generateLogicalOptions = (correctAnswer: string, type: string): string[] => {
    const options = [correctAnswer];
    
    if (type === 'logical') {
      // Generate contextually relevant wrong answers based on pattern type
      if (pattern.sequence.includes('→')) {
        // For sequence patterns
        if (pattern.sequence.includes('Spring') || pattern.sequence.includes('Summer')) {
          options.push(...['Winter', 'Autumn', 'July'].filter(o => o !== correctAnswer));
        } else if (pattern.sequence.includes('Red') || pattern.sequence.includes('Orange')) {
          options.push(...['Purple', 'Brown', 'Pink'].filter(o => o !== correctAnswer));
        } else {
          // Generic sequence wrong answers
          options.push(...['Next', 'End', 'Skip'].filter(o => o !== correctAnswer));
        }
      } else if (pattern.sequence.includes('(')) {
        // For grouped patterns (e.g., (Red,Circle,Small))
        options.push(...['Large', 'Small', 'Round'].filter(o => o !== correctAnswer));
      } else {
        // For word patterns
        options.push(...['Similar', 'Different', 'None'].filter(o => o !== correctAnswer));
      }
    } else {
      // Helper to generate wrong math answers
      const generateMathWrongAnswer = () => {
        if (pattern.answer.includes('\\sum')) {
          // For summation patterns, modify the upper limit
          const n = Math.floor(Math.random() * 3) + 2;
          return `\\sum_{n=1}^${n} n`;
        }
        if (pattern.answer.includes('\\prod')) {
          // For product patterns, modify the upper limit
          const n = Math.floor(Math.random() * 3) + 2;
          return `\\prod_{i=1}^${n} i`;
        }
        if (pattern.answer.includes('\\int')) {
          // For integral patterns, modify the upper limit
          const n = Math.floor(Math.random() * 3) + 2;
          return `\\int_0^${n} x`;
        }
        return correctAnswer; // Fallback
      };

      // Generate wrong answers based on pattern type
      while (options.length < 4) {
        let wrongAnswer;
        if (pattern.answer.includes('\\')) {
          // Math pattern
          wrongAnswer = generateMathWrongAnswer();
        } else {
          // Shape pattern
          const symbols = ['●', '■', '▲', '▼', '◆', '○', '□', '△'];
          wrongAnswer = symbols[Math.floor(Math.random() * symbols.length)];
        }
        
        if (!options.includes(wrongAnswer)) {
          options.push(wrongAnswer);
        }
      }
    }

    // Ensure we have exactly 4 options
    while (options.length < 4) {
      const randomOption = `Option ${options.length + 1}`;
      if (!options.includes(randomOption)) {
        options.push(randomOption);
      }
    }

    return options.sort(() => Math.random() - 0.5);
  };

  const options = useMemo(() => 
    generateLogicalOptions(pattern.answer, pattern.type), 
    [pattern]
  );

  // Cleanup KaTeX instances
  useEffect(() => {
    return () => {
      optionRefs.current.forEach(ref => {
        if (ref) ref.innerHTML = '';
      });
    };
  }, [pattern]);

  useEffect(() => {
    if (pattern.type === 'symbolic') {
      options.forEach((option, index) => {
        const ref = optionRefs.current[index];
        if (ref) {
          ref.innerHTML = '';  // Clear previous render
          katex.render(option, ref, {
            throwOnError: false,
            displayMode: true
          });
        }
      });
    }
  }, [options, pattern.type]);

  if (pattern.type === 'symbolic' && window.MathJax) {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-3 rounded-md border-2 border-gray-200 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  const getButtonStyle = (option: string) => {
    if (disabled) return 'opacity-50 cursor-not-allowed';
    if (submitted && selectedAnswer === option) {
      return option === pattern.answer 
        ? 'border-green-500 bg-green-50' 
        : 'border-red-500 bg-red-50';
    }
    return selectedAnswer === option 
      ? 'border-emerald-500'
      : 'border-gray-200 hover:border-gray-300';
  };

  const isMathPattern = pattern.answer.includes('\\');

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={`p-3 rounded-md border-2 transition-colors ${getButtonStyle(option)}`}
        >
          {isMathPattern ? (
            <div ref={el => optionRefs.current[index] = el} /> // LaTeX math
          ) : (
            <span className="text-2xl">{option}</span> // Unicode shapes
          )}
        </button>
      ))}
    </div>
  );
} 