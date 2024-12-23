const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Development CORS setup
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: ['https://frontend-two-nu-17.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  : {
      origin: true, // Allow all origins in development
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
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Generate a pattern following these rules:
                            1. Choose a type: numeric (math), symbolic (shapes/symbols), or logical (letters/words)
                            2. Create a sequence with 4 visible items and 1 hidden (marked as ?)
                            3. Make it challenging but solvable
                            4. Include a clear pattern rule
                            Respond EXACTLY in this format: sequence|answer|hint|type|difficulty
                            Example: 2, 4, 6, 8, ?|10|Look for addition|numeric|medium`
                    },
                    {
                        role: "user",
                        content: "Create a new pattern. Be creative and vary between different types."
                    }
                ],
                temperature: 0.7,  // Reduced for more consistent formatting
                max_tokens: 100,
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
        const parts = text.split('|').map(part => part.trim());

        // Validate response format
        if (parts.length !== 5) {
            throw new Error('Invalid pattern format from AI');
        }

        const [sequence, answer, hint, type, difficulty] = parts;

        // Ensure all required fields exist
        if (!sequence || !answer || !hint || !type || !difficulty) {
            throw new Error('Missing required pattern components');
        }

        // Default to 'numeric' if type is invalid
        const validTypes = ['numeric', 'symbolic', 'logical'];
        const normalizedType = type.toLowerCase();
        const finalType = validTypes.includes(normalizedType) ? normalizedType : 'numeric';

        // Default to 'medium' if difficulty is invalid
        const validDifficulties = ['easy', 'medium', 'hard'];
        const normalizedDifficulty = difficulty.toLowerCase();
        const finalDifficulty = validDifficulties.includes(normalizedDifficulty) ? normalizedDifficulty : 'medium';

        res.json({ 
            sequence,
            answer,
            type: finalType,
            difficulty: finalDifficulty,
            hint
        });

    } catch (error) {
        console.error('Full error:', error);
        // Send a more specific error message
        res.status(500).json({ 
            error: 'Error generating pattern',
            details: error.message,
            // Provide fallback pattern in case of error
            fallback: {
                sequence: '2, 4, 6, 8, ?',
                answer: '10',
                type: 'numeric',
                difficulty: 'medium',
                hint: 'Look for a constant difference'
            }
        });
    }
});

app.post('/get-hint', async (req, res) => {
    try {
        const { pattern, userAttempts } = req.body;
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a pattern analysis assistant. Given a sequence and its type:
                            1. Analyze the pattern structure
                            2. Provide a helpful hint based on attempts made
                            3. Don't reveal the answer directly
                            4. Consider the pattern type (${pattern.type}) when giving hints`
                    },
                    {
                        role: "user",
                        content: `Pattern: ${pattern.sequence}
                                Type: ${pattern.type}
                                Previous attempts: ${userAttempts}
                                Provide a helpful hint.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
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
