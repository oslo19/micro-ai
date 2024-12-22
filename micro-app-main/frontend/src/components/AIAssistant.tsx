import { Brain } from 'lucide-react';
import { AIHint } from '../types';

interface AIAssistantProps {
  hint: AIHint | null;
}

export function AIAssistant({ hint }: AIAssistantProps) {
  if (!hint) return null;

  const confidencePercentage = Math.round(hint.confidence * 100);
  
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Brain className="w-5 h-5 text-emerald-500 shrink-0" />
        <span className="font-medium">AI Assistant</span>
        <span className="text-sm text-gray-500">
          ({confidencePercentage}% confidence)
        </span>
      </div>
      <p className="text-gray-700 text-sm md:text-base">{hint.hint}</p>
      <p className="text-xs md:text-sm text-gray-500 mt-1">{hint.reasoning}</p>
    </div>
  );
}