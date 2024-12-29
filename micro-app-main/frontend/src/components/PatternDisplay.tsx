import { useEffect, useRef, useState } from 'react';
import { Pattern } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import katex from 'katex';

export function PatternDisplay({ pattern, isLoading }: { pattern: Pattern | null, isLoading: boolean }) {
  const mathRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const renderSimplifiedPattern = (sequence: string) => {
    // Convert complex LaTeX to simpler representation
    return sequence
      .replace(/\\sum_\{([^}]*)\}\^\{([^}]*)\}/g, '∑')
      .replace(/\\prod_\{([^}]*)\}\^\{([^}]*)\}/g, '∏')
      .replace(/\\int_\{([^}]*)\}\^\{([^}]*)\}/g, '∫')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
  };

  useEffect(() => {
    if (pattern?.type === 'symbolic' && mathRef.current) {
      const renderMath = async () => {
        setIsRendering(true);
        try {
          requestAnimationFrame(() => {
            try {
              katex.render(pattern.sequence, mathRef.current!, {
                throwOnError: true,
                displayMode: true,
                maxSize: 5,
                maxExpand: 50,
                strict: true,
                trust: false,
                macros: {},
                errorColor: '#ff0000',
                output: 'html'
              });
            } catch (error) {
              // If KaTeX fails, use simplified rendering
              mathRef.current!.textContent = renderSimplifiedPattern(pattern.sequence);
              setRenderError(true);
            }
          });
        } finally {
          setIsRendering(false);
        }
      };

      renderMath();
    }
  }, [pattern]);

  // Show loading state while rendering
  if (isRendering) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
      <div className="flex justify-center items-center gap-2">
        <LoadingSpinner />
        <p className="text-lg md:text-xl text-gray-500">Generating pattern...</p>
      </div>
    </div>
  );

  if (!pattern) return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
      <p className="text-lg md:text-xl">Click "Generate" to start.</p>
    </div>
  );

  const difficultyColor = {
    easy: 'text-emerald-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500'
  }[pattern.difficulty];

  return (
    <div className="mb-4">
      <div className="bg-gray-100 p-4 md:p-6 rounded-lg text-center">
        <div className="text-xl md:text-2xl font-bold mb-2">
          {pattern?.type === 'symbolic' && pattern.sequence.includes('\\') ? (
            renderError ? (
              <div className="text-gray-800">
                {renderSimplifiedPattern(pattern.sequence)}
              </div>
            ) : (
              <div ref={mathRef} />
            )
          ) : (
            <span className="break-all">{pattern?.sequence}</span>
          )}
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