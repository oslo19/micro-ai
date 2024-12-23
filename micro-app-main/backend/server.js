const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Development CORS setup
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: [
        'https://frontend-two-nu-17.vercel.app',
        'https://frontend-ltehs4ruz-oslo19s-projects.vercel.app',
        'https://bakend-ashen.vercel.app',
        'http://localhost:5173'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  : {
      origin: true,
      credentials: true
    };

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Pattern Generator API is running',
        endpoints: {
            generatePattern: 'POST /generate-pattern',
            getHint: 'POST /get-hint',
            testOpenAI: 'GET /test-openai'
        }
    });
});

app.post('/generate-pattern', async (req, res) => {
    try {
        console.log('Making request to OpenAI...');
        
        const types = ['numeric', 'symbolic', 'logical'];
        const requestedType = req.body.type || types[Math.floor(Math.random() * types.length)];
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an advanced pattern generation system for college students.
                            Generate a challenging college-level pattern of type: ${requestedType}

                            For NUMERIC patterns:
                            - Use advanced mathematical concepts (calculus, number theory, complex functions)
                            - Include sequences that test mathematical understanding
                            - Consider using series, progressions, or mathematical relationships

                            For SYMBOLIC patterns:
                            - Use mathematical or logical symbols (∑, ∏, ∫, ∂, ∮, ∪, ∩, ⊂, ⊃, ∈, ∉, etc.)
                            - Create meaningful progressions in mathematical notation
                            - Consider patterns from set theory, calculus, or logic

                            For LOGICAL patterns:
                            - Use programming concepts, scientific terms, or academic sequences
                            - Create patterns that test understanding of relationships
                            - Consider computer science, mathematics, or scientific concepts

                            IMPORTANT: 
                            1. Response must be in format: sequence|answer|hint|${requestedType}|difficulty
                            2. Sequence should have 4 visible items and 1 hidden (?)
                            3. Make it challenging but solvable
                            4. Ensure hint is helpful but doesn't give away the answer
                            5. Difficulty should be medium or hard`
                    },
                    {
                        role: "user",
                        content: `Generate a challenging college-level ${requestedType} pattern. Respond only with the pattern in the specified format.`
                    }
                ],
                temperature: 0.8,
                max_tokens: 150,
                presence_penalty: 0.6,
                frequency_penalty: 0.6
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const text = response.data.choices[0].message.content.trim();
        console.log('AI Response:', text);

        const parts = text.split('|').map(part => part.trim());

        if (parts.length !== 5) {
            console.error('Invalid parts length:', parts.length, 'Parts:', parts);
            throw new Error('Invalid pattern format from AI');
        }

        const [sequence, answer, hint, type, difficulty] = parts;

        if (!sequence || !answer || !hint || !type || !difficulty) {
            throw new Error('Missing required pattern components');
        }

        res.json({ 
            sequence,
            answer,
            type: requestedType,
            difficulty: difficulty.toLowerCase(),
            hint
        });

    } catch (error) {
        console.error('Full error:', error);
        
        // Generate a fallback pattern using GPT-4
        try {
            const fallbackResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: `Generate a simple but engaging ${requestedType} pattern for error recovery.
                                Must follow format: sequence|answer|hint|${requestedType}|difficulty
                                Keep it straightforward but interesting.`
                        },
                        {
                            role: "user",
                            content: "Generate a fallback pattern."
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 100
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const fallbackText = fallbackResponse.data.choices[0].message.content.trim();
            const fallbackParts = fallbackText.split('|').map(part => part.trim());

            if (fallbackParts.length === 5) {
                const [sequence, answer, hint, type, difficulty] = fallbackParts;
                res.status(500).json({
                    error: 'Error generating primary pattern',
                    details: error.message,
                    fallback: {
                        sequence,
                        answer,
                        type: requestedType,
                        difficulty: difficulty.toLowerCase(),
                        hint
                    }
                });
                return;
            }
        } catch (fallbackError) {
            console.error('Fallback generation failed:', fallbackError);
        }

        // If both primary and fallback generation fail, send a generic error
        res.status(500).json({
            error: 'Failed to generate pattern',
            details: 'Both primary and fallback pattern generation failed'
        });
    }
});

app.post('/get-hint', async (req, res) => {
    try {
        const { pattern, userAttempts } = req.body;
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an advanced pattern analysis assistant for college students.
                            Given a sequence and its type:
                            1. Analyze the pattern's underlying mathematical, logical, or symbolic structure
                            2. Provide progressive hints based on:
                               - Number of previous attempts
                               - Pattern complexity
                               - Academic level concepts
                            3. Never reveal the answer directly
                            4. Include relevant academic concepts in hints
                            5. Guide students toward understanding the pattern's logic`
                    },
                    {
                        role: "user",
                        content: `Pattern: ${pattern.sequence}
                                Type: ${pattern.type}
                                Previous attempts: ${userAttempts}
                                Difficulty: ${pattern.difficulty}
                                Provide a helpful hint.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const hint = response.data.choices[0].message.content.trim();

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
            hint,
            confidence,
            reasoning: `AI analysis based on ${pattern.type} pattern and ${userAttempts} attempts`
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error generating hint',
            details: error.message
        });
    }
});

app.get('/test-openai', async (req, res) => {
    try {
        console.log('Testing OpenAI token...');
        const response = await axios.get(
            'https://api.openai.com/v1/models',
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json({ 
            status: 'Token valid', 
            models: response.data.data.slice(0, 5) // Show first 5 models
        });
    } catch (error) {
        console.error('Full error:', error);
        res.status(401).json({ 
            error: 'Token invalid',
            details: error.message,
            tip: 'Check if token has correct permissions and starts with sk-'
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
