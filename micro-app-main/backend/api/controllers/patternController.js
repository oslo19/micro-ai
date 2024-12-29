const axios = require('axios');
const Pattern = require('../models/Pattern');
const CompletedPattern = require('../models/CompletedPattern');

const validatePattern = async (pattern) => {
    try {
        // Add timeout and retry logic
        const config = {
            timeout: 5000, // 5 second timeout
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            maxRetries: 2
        };

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [{ 
                    role: "user", 
                    content: `Is the pattern ${pattern.sequence} ambiguous? Answer only yes or no.`
                }],
                temperature: 0.3
            },
            config
        );

        // Simplified check
        const answer = response.data.choices[0].message.content.toLowerCase();
        return answer.includes('no');

    } catch (error) {
        console.error('Validation error:', error);
        return true; // Allow pattern on validation error
    }
};

const generatePattern = async (req, res) => {
    try {
        const userId = req.body.userId;
        
        // Get completed patterns for this user
        const completedPatterns = await CompletedPattern.find({ 
            userId,
            type: req.body.type || { $exists: true }
        }).select('sequence');

        const excludeSequences = completedPatterns.map(p => p.sequence);

        // Only log when actually generating
        if (req.body.type || req.body.difficulty) {
            console.log('Making request to OpenAI...');
            
            const types = ['numeric', 'symbolic', 'shape', 'logical'];
            const requestedType = req.body.type || types[Math.floor(Math.random() * types.length)];
            const requestedDifficulty = req.body.difficulty || 'medium';
            
            const systemPrompt = `Generate college-level patterns in this format:
<sequence>|<answer>|<hint>|<type>|<difficulty>|<explanation>

Pattern Types:

1. Shape Patterns:
Easy:
- Basic: ●, ●●, ●●●, ?|●●●●|Count shapes|shape|easy|Adding one shape
- Alternating: ■, ●, ■, ?|●|Watch pattern|shape|easy|Two shapes alternate

Medium:
- Mixed: ▲■, ■●, ●▲, ?|▲■|Watch pairs|shape|medium|Rotating shapes
- Growing: ■●, ■●●, ■●●●, ?|■●●●●|Count second shape|shape|medium|First stays, second grows

Hard:
- Complex Pairs: ▲■●, ■●▲, ●▲■, ?|▲■●|Watch triple rotation|shape|hard|Three shapes rotate
- Nested: (●■), (●▲), (●■▲●), ?|(●■▲●■)|Pattern grows both sides|shape|hard|Symmetric growth
- Mirror: ▲■▲, ●■●, ▼■▼, ?|△■△|Mirror around center|shape|hard|Center stays fixed

2. Symbolic Mathematical Patterns:
Easy:
- Basic Sum: \\sum_{n=1}^1 n, \\sum_{n=1}^2 n, ?|\\sum_{n=1}^3 n|Look at limits|symbolic|easy|Simple summation
- Simple Product: \\prod_{i=1}^1 i, \\prod_{i=1}^2 i, ?|\\prod_{i=1}^3 i|Study pattern|symbolic|easy|Basic factorial

Medium:
- Summation: \\sum_{n=1}^2 n, \\sum_{n=1}^3 n, \\sum_{n=1}^4 n, ?|\\sum_{n=1}^5 n|Look at limits|symbolic|medium|Increasing upper limit
- Integration: \\int_0^1 x dx, \\int_0^2 x dx, ?|\\int_0^3 x dx|Watch limits|symbolic|medium|Integration pattern
- Series: \\frac{1}{1}, \\frac{1}{2}, \\frac{1}{3}, ?|\\frac{1}{4}|Study fractions|symbolic|medium|Fraction sequence

Hard:
- Complex Products: \\prod_{i=1}^2 i^2, \\prod_{i=1}^3 i^2, ?|\\prod_{i=1}^4 i^2|Study pattern|symbolic|hard|Square product series
- Double Sums: \\sum_{i=1}^2\\sum_{j=1}^i j, \\sum_{i=1}^3\\sum_{j=1}^i j, ?|\\sum_{i=1}^4\\sum_{j=1}^i j|Nested sums|symbolic|hard|Double summation
- Complex Integration: \\int_0^1 x^2 dx, \\int_0^2 x^2 dx, ?|\\int_0^3 x^2 dx|Study pattern|symbolic|hard|Quadratic integration

3. Logical Patterns:
Easy:
- Sequence: Monday→Tuesday→Wednesday, January→February→March, Summer→?|Fall|Calendar sequence|logical|easy|Time progression pattern
- Word Pairs: Hot-Cold, Up-Down, Left-?|Right|Opposites pattern|logical|easy|Common antonyms
- Letter Series: ABC→CDE→EFG, BCD→DEF→?|FGH|Letter progression|logical|easy|Moving window pattern

Medium:
- Word Math: Big+Bigger=Biggest, Strong+Stronger=?, Small+?=?|Strongest,Smaller,Smallest|Word comparisons|logical|medium|Comparative progression
- Code Pattern: A1→B2→C3, D4→E5→?|F6|Letter-number pairs|logical|medium|Dual sequence pattern
- Word Chain: Water→Ice→Solid, Gas→Liquid→?|Water|State cycles|logical|medium|Physical states

Hard:
- Logic Grid: (Red,Circle,Small), (Blue,Square,Large), (Green,Triangle,?)|Medium|Complete the pattern|logical|hard|Property relationships
- Word Transform: HELLO→WORLD→PEACE, EARTH→SPACE→?|STARS|Word connections|logical|hard|Conceptual progression
- Concept Web: (Sun:Light:Day), (Moon:Dark:Night), (Star:?:?)|Bright,Evening|Complete the trio|logical|hard|Related concepts

RULES:
1. For logical patterns, focus on:
   - Clear relationships between elements
   - Consistent pattern rules
   - Educational value
   - Real-world connections
2. Include explanation that helps understand the logic
3. Avoid ambiguous or culture-specific patterns
4. Ensure single, definitive answers
5. Progress difficulty through complexity, not obscurity

Available Symbols:
● ■ ▲  ◆ ○ □ △ ▽ ◇

RULES:
1. For 'shape' type, use only shape patterns
2. For 'symbolic' type, use mathematical notation
3. Include all 6 parts in response
4. Use proper LaTeX notation for mathematical patterns
5. Make patterns progressively more complex with difficulty

EXPLANATION FORMAT:
For Shape Patterns:
- Identify the pattern type (repetition, growth, transformation)
- Explain step by step how shapes change or grow
- Point out the rule for the next shape
Example: "This is a growing pattern where each step adds a new shape to the left. Step 1: □, Step 2: ○□, Step 3: △○□. Following this rule, we add ◇ to the left in Step 4."

ADDITIONAL RULES:
6. Do not generate any of these patterns: ${excludeSequences.join(', ')}`;

            // Add complexity check for symbolic patterns
            if (requestedType === 'symbolic') {
                // Simplify symbolic patterns
                const messages = [{
                    role: "system",
                    content: "Generate only basic mathematical patterns. Avoid derivatives, complex integrals, and nested sums. Prefer simple summations and products."
                }, {
                    role: "user",
                    content: `Generate a ${requestedDifficulty}-level pattern with basic operations only.`
                }];
            }

            // Add shorter timeout for symbolic patterns
            const timeout = requestedType === 'symbolic' ? 8000 : 10000;

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: `Generate a ${requestedDifficulty}-level ${requestedType} pattern. Return ONLY the pattern in the specified format with NO additional text.`
                        }
                    ],
                    temperature: 0.9,
                    presence_penalty: 1.0,
                    frequency_penalty: 1.0,
                    max_tokens: requestedType === 'symbolic' ? 150 : 200 // Shorter responses for symbolic
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout
                }
            );

            const text = response.data.choices[0].message.content.trim();
            console.log('AI Response:', text);

            const parts = text.split('|').map(part => part.trim());
            
            if (parts.length !== 6) {
                console.error('Invalid response format:', text);
                console.error('Parts:', parts);
                throw new Error(`Invalid pattern format: expected 6 parts, got ${parts.length}`);
            }

            const [sequence, answer, hint, type, difficulty, explanation] = parts;

            if (!sequence || !answer || !hint || !type || !difficulty) {
                throw new Error('Missing required pattern components');
            }

            // Only validate after successful generation
            if (requestedType === 'symbolic') {
                const isValid = await validatePattern({ sequence, answer, hint, type, difficulty, explanation });
                if (!isValid) {
                    return generatePattern(req, res);
                }
            }

            res.json({ 
                sequence,
                answer,
                type: requestedType,
                difficulty: requestedDifficulty.toLowerCase(),
                hint,
                explanation
            });
        }
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(500).json({
                error: 'Request timeout',
                details: 'Pattern generation took too long'
            });
            return;
        }
        console.error('Error generating pattern:', error);
        
        try {
            const fallbackResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: `Generate a simple ${requestedType} pattern in this EXACT format:
                                <sequence>|<answer>|<hint>|${requestedType}|${requestedDifficulty}|<explanation>`
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

            if (fallbackParts.length === 6) {
                const [sequence, answer, hint, type, difficulty, explanation] = fallbackParts;
                res.status(500).json({
                    error: 'Error generating primary pattern',
                    details: error.message,
                    fallback: {
                        sequence,
                        answer,
                        type: requestedType,
                        difficulty: requestedDifficulty,
                        hint,
                        explanation
                    }
                });
                return;
            }
        } catch (fallbackError) {
            console.error('Fallback generation failed:', fallbackError);
        }

        res.status(500).json({
            error: 'Failed to generate pattern',
            details: 'Both primary and fallback pattern generation failed'
        });
    }
};

const symbolicPatterns = {
  easy: [
    {
      sequence: "\\frac{1}{2}, \\frac{2}{3}, \\frac{3}{4}, ?",
      answer: "\\frac{4}{5}",
      hint: "Look at numerator and denominator",
      explanation: "Each number increases by 1"
    },
    {
      sequence: "x^1, x^2, x^3, ?",
      answer: "x^4",
      hint: "Look at exponents",
      explanation: "Powers increase by 1"
    }
  ],
  medium: [
    {
      sequence: "\\frac{1}{1}, \\frac{1}{2}, \\frac{1}{3}, ?",
      answer: "\\frac{1}{4}",
      hint: "Look at denominators",
      explanation: "Denominators increase by 1"
    },
    {
      sequence: "2^1, 2^2, 2^3, ?",
      answer: "2^4",
      hint: "Look at exponents",
      explanation: "Powers of 2 sequence"
    }
  ],
  hard: [
    {
      sequence: "\\sqrt{1}, \\sqrt{4}, \\sqrt{9}, ?",
      answer: "\\sqrt{16}",
      hint: "Look at numbers under root",
      explanation: "Perfect squares sequence"
    }
  ]
};

module.exports = {
    generatePattern
}; 