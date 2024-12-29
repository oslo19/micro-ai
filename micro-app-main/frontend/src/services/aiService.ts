import { Pattern, PatternType, DifficultyLevel, GeneratePatternOptions } from '../types';
import { generateAIHint } from '../utils/aiHelper';

const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, '').trim();

const fetchWithRetry = async (url: string, options: RequestInit) => {
    const cleanUrl = url.replace(/\/+/g, '/');
    const response = await fetch(cleanUrl, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    return response;
};

export const generatePattern = async (options: GeneratePatternOptions = {}): Promise<Pattern> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetchWithRetry(`${API_URL}/patterns/generate`, {
            method: 'POST',
            body: JSON.stringify(options),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || 'Failed to generate pattern');
        }

        return {
            sequence: data.sequence,
            answer: data.answer,
            type: data.type as PatternType,
            difficulty: data.difficulty as DifficultyLevel,
            hint: data.hint || '',
            explanation: data.explanation
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            console.error('Error generating pattern:', error);
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

export const getAIHint = async (pattern: Pattern, userAttempts: number) => {
    try {
        const response = await fetch(`${API_URL}/api/patterns/hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pattern, userAttempts }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to get hint');
        }

        const data = await response.json();
        return {
            hint: data.hint,
            confidence: data.confidence,
            reasoning: data.reasoning
        };
    } catch (error) {
        console.error('Error getting AI hint:', error);
        return generateAIHint(pattern, userAttempts);
    }
};
