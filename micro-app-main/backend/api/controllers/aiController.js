const axios = require('axios');

const getHint = async (req, res) => {
    try {
        const { pattern, userAttempts } = req.body;
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an advanced mathematics tutor helping college students understand pattern recognition.
                            
                            For each attempt, provide increasingly detailed explanations:

                            Attempt 1 (Basic Understanding):
                            - Identify the pattern type (sequence, series, transformation)
                            - Point out key mathematical notation
                            - Explain basic concepts involved
                            - Provide general strategy

                            Attempt 2 (Deeper Analysis):
                            - Break down pattern components
                            - Explain mathematical relationships
                            - Show relevant formulas
                            - Demonstrate pattern progression
                            - Connect to familiar concepts

                            Attempt 3 (Comprehensive Breakdown):
                            - Detailed step-by-step analysis
                            - Show work for previous terms
                            - Explain pattern logic thoroughly
                            - Provide similar examples
                            - Connect to advanced concepts
                            - Everything except direct answer

                            Format response EXACTLY as:
                            Key Observation: (Clear mathematical insight)
                            
                            Hint: (Progressive hint for attempt ${userAttempts})
                            
                            Analysis:
                            1. Pattern Type: (Identify the mathematical structure)
                            2. Components: (Break down notation and symbols)
                            3. Progression: (How terms change)
                            4. Mathematical Logic: (Why this pattern works)
                            5. Previous Terms: (Show calculations)
                            
                            Tips:
                            - Specific technique 1
                            - Common pitfall to avoid
                            - Problem-solving strategy
                            
                            Related Topics:
                            - Core concept 1 (with brief explanation)
                            - Core concept 2 (with brief explanation)
                            - Advanced applications`
                    },
                    {
                        role: "user",
                        content: `Pattern: ${pattern.sequence}
                                Type: ${pattern.type}
                                Attempt: ${userAttempts}
                                Difficulty: ${pattern.difficulty}
                                Previous hints: ${pattern.previousHints || 'none'}
                                Provide detailed educational guidance.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000  // Increased for more detailed response
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        const fullResponse = response.data.choices[0].message.content.trim();
        const [keyObs, hint, analysis, tips, concepts] = fullResponse.split('\n\n');

        // Get AI confidence in the hint
        const confidenceResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Rate the pattern complexity and hint effectiveness. Return only a number between 0 and 1."
                    },
                    {
                        role: "user",
                        content: `Pattern: ${pattern.sequence}
                                 Hint given: "${hint}"
                                 Rate confidence (0-1):`
                    }
                ],
                temperature: 0.3,
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const confidence = parseFloat(confidenceResponse.data.choices[0].message.content.trim()) || 0.9;

        res.json({
            hint: hint.replace('Hint: ', ''),
            confidence,
            reasoning: analysis.replace('Analysis: ', ''),
            tips: tips.replace('Tips: ', '').split('\n').map(tip => tip.trim()),
            relatedConcepts: concepts.replace('Related Topics: ', ''),
            attemptNumber: userAttempts
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error generating hint',
            details: error.message
        });
    }
};

module.exports = {
    getHint
}; 