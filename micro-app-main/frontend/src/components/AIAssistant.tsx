import { Brain } from 'lucide-react';
import { AIHint } from '../types';

interface AIAssistantProps {
  hint: AIHint | null;
  isLoading?: boolean;
}

export function AIAssistant({ hint, isLoading }: AIAssistantProps) {
  if (isLoading) {
    return (
      <div className="mt-4 bg-gray-50 rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="font-medium">AI Assistant is analyzing the pattern...</span>
        </div>
      </div>
    );
  }

  if (!hint) return null;

  const confidencePercentage = Math.round(hint.confidence * 100);
  
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-6 h-6 text-emerald-500" />
        <span className="font-semibold text-lg">Pattern Analysis Assistant</span>
        <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
          Hint {hint.attemptNumber} of 3
        </span>
      </div>

      <div className="space-y-4">
        {/* Key Observation */}
        <div>
          <h3 className="font-medium text-gray-700 mb-1">Key Observation:</h3>
          <p className="text-gray-600">{hint.hint}</p>
        </div>

        {/* Detailed Explanation */}
        <div>
          <h3 className="font-medium text-gray-700 mb-1">Step-by-Step Analysis:</h3>
          <p className="text-gray-600 whitespace-pre-line">{hint.reasoning}</p>
        </div>

        {/* Learning Tips */}
        {hint.tips && (
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-medium text-blue-800 mb-1">Learning Tips:</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              {hint.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Concepts */}
        {hint.relatedConcepts && (
          <div className="bg-purple-50 p-3 rounded">
            <h3 className="font-medium text-purple-800 mb-1">Related Concepts:</h3>
            <p className="text-purple-700">{hint.relatedConcepts}</p>
          </div>
        )}
      </div>
    </div>
  );
}