import { Pattern } from '../types';
import { generateAIHint } from '../utils/aiHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function getAIHint(pattern: Pattern, userAttempts: number) {
    try {
        const response = await fetch(`${API_BASE_URL}/get-hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pattern,
                userAttempts
            })
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
}

interface PatternResponse {
    sequence: string;
    answer: string;
    type: string;
    difficulty: string;
    hint: string;
}

export const generatePattern = async (): Promise<PatternResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-pattern`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.fallback) {
                return data.fallback;
            }
            throw new Error(data.details || 'Failed to generate pattern');
        }

        return {
            sequence: data.sequence,
            answer: data.answer,
            type: data.type || 'numeric',
            difficulty: data.difficulty || 'medium',
            hint: data.hint || ''
        };
    } catch (error) {
        console.error('Error generating pattern:', error);
        throw error;
    }
}; 