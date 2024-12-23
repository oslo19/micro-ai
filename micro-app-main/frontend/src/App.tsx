import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { InputGroup } from './components/InputGroup';
import { Feedback } from './components/Feedback';
import { AIAssistant } from './components/AIAssistant';
import { Pattern, FeedbackState, AIHint } from './types';
import { getAIHint, generatePattern } from './services/aiService';
import { saveProgress, getProgress } from './utils/progressTracker';
import { PatternDisplay } from './components/PatternDisplay';

function App() {
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({ message: '', type: null });
  const [attempts, setAttempts] = useState(0);
  const [aiHint, setAIHint] = useState<AIHint | null>(null);
  const [userProgress, setUserProgress] = useState(getProgress());
  const [selectedType, setSelectedType] = useState<'random' | 'numeric' | 'symbolic' | 'logical'>('random');

  const handleGeneratePattern = async () => {
    try {
      const options = selectedType === 'random' ? {} : { type: selectedType };
      const newPattern = await generatePattern(options);
      setCurrentPattern({
        sequence: newPattern.sequence,
        answer: newPattern.answer,
        type: newPattern.type,
        difficulty: newPattern.difficulty,
        hint: '',
        explanation: ''
      });
      setUserAnswer('');
      setFeedback({ message: '', type: null });
      setAttempts(0);
      setAIHint(null);
    } catch (error) {
      console.error('Error generating pattern:', error);
      setFeedback({
        message: 'Failed to generate pattern. Please try again.',
        type: 'error'
      });
    }
  };

  const checkAnswer = async () => {
    if (!currentPattern) {
      alert('Please generate a pattern first.');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const userAnswerClean = userAnswer.trim().toLowerCase();
    const correctAnswerClean = (currentPattern.answer || '').toString().trim().toLowerCase();

    const isCorrect = userAnswerClean === correctAnswerClean;

    if (isCorrect) {
      const points = Math.max(10 - (attempts * 2), 5);
      setScore(prev => prev + points);
      
      const progress = saveProgress(points, newAttempts, true);
      setUserProgress(progress);
      
      setFeedback({
        message: 'Correct! Well done!',
        type: 'success'
      });
      setAttempts(0);
    } else {
      const hint = await getAIHint(currentPattern, newAttempts);
      setAIHint(hint);

      setFeedback({
        message: newAttempts === 3 ? 
          'Still incorrect. You can now use the Show Answer button below.' : 
          newAttempts === 1 ? 
            'Not quite right. Try looking at the pattern more carefully!' : 
            'Still incorrect. Check the AI hint below for guidance!',
        type: 'error'
      });

      saveProgress(0, newAttempts, false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      checkAnswer();
    }
  };

  const handleShowAnswer = () => {
    if (currentPattern) {
      setFeedback({
        message: `The correct answer is: ${currentPattern.answer}`,
        type: 'error',
        explanation: currentPattern.explanation || 'Keep practicing to improve your pattern recognition!'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
          <Brain className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-500">Pattern Completion</h1>
        </div>

        <PatternDisplay pattern={currentPattern} />

        <div className="space-y-4">
          {currentPattern && (
            <InputGroup
              pattern={currentPattern}
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={checkAnswer}
              onKeyPress={handleKeyPress}
              disabled={!currentPattern}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setSelectedType('random')}
              className={`px-3 py-1 rounded ${
                selectedType === 'random' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
              }`}
            >
              Random
            </button>
            <button
              onClick={() => setSelectedType('numeric')}
              className={`px-3 py-1 rounded ${
                selectedType === 'numeric' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
              }`}
            >
              Numeric
            </button>
            <button
              onClick={() => setSelectedType('symbolic')}
              className={`px-3 py-1 rounded ${
                selectedType === 'symbolic' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
              }`}
            >
              Symbolic
            </button>
            <button
              onClick={() => setSelectedType('logical')}
              className={`px-3 py-1 rounded ${
                selectedType === 'logical' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
              }`}
            >
              Logical
            </button>
          </div>

          <button
            onClick={handleGeneratePattern}
            className="w-full bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors"
          >
            Generate Pattern
          </button>

          <button
            onClick={handleShowAnswer}
            disabled={attempts < 3}
            className={`w-full px-4 py-2 rounded-md transition-colors
              ${attempts >= 3 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {attempts >= 3 ? 'Show Answer' : `Show Answer (${3 - attempts} more attempts needed)`}
          </button>
        </div>

        <Feedback feedback={feedback} />
        <AIAssistant hint={aiHint} />

        <div className="mt-4 text-center">
          <div className="text-lg font-semibold">Score: {score}</div>
          {userProgress && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Your Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white rounded shadow-sm">
                  <p className="text-gray-600">Total Score</p>
                  <p className="font-medium text-lg">{userProgress.totalScore}</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <p className="text-gray-600">Success Rate</p>
                  <p className="font-medium text-lg">
                    {Math.round((userProgress.correctAnswers / userProgress.gamesPlayed) * 100)}%
                  </p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <p className="text-gray-600">Games Played</p>
                  <p className="font-medium text-lg">{userProgress.gamesPlayed}</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <p className="text-gray-600">Avg. Attempts</p>
                  <p className="font-medium text-lg">{userProgress.averageAttempts.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;