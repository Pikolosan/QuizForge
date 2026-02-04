import { GoogleGenAI } from '@google/genai';
import { AIQuizResponseSchema, AIQuizRequest, AIQuizResponse } from '../schemas/aiQuizSchema';

export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenAI({
      apiKey: apiKey
    });
  }

  /**
   * Generate quiz questions using Gemini AI
   */
  async generateQuizQuestions(request: AIQuizRequest): Promise<AIQuizResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.5, // Reduced from 0.7 for more focused responses
          topK: 40,
          topP: 0.9, // Reduced from 0.95 for less randomness
          maxOutputTokens: 16384,
        }
      });
      
      const text = response.text;
      
      // Check if text is defined
      if (!text) {
        throw new Error('No text response from AI');
      }
      
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // Remove ```json and ``` markers
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      cleanedText = cleanedText.trim();
      
      // Check if response looks incomplete
      if (!cleanedText.endsWith('}') && !cleanedText.endsWith(']')) {
        console.error('AI response appears truncated. Last 200 chars:', cleanedText.slice(-200));
        throw new Error('AI response was truncated');
      }
      
      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON. Last 300 chars:', cleanedText.slice(-300));
        throw new Error('Invalid JSON response from AI');
      }
      
      // Validate the response using Zod
      const validatedResponse = AIQuizResponseSchema.parse(parsedResponse);
      
      return validatedResponse;
    } catch (error) {
      console.error('Error generating quiz with Gemini:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error(`AI response validation failed: ${error.message}`);
      }
      
      throw new Error('Failed to generate quiz questions');
    }
  }

  /**
   * Build the prompt for Gemini AI
   */
  private buildPrompt(request: AIQuizRequest): string {
    const difficultyDescriptions = {
      easy: 'basic concepts and fundamentals that a beginner should know',
      medium: 'intermediate concepts requiring some experience and understanding',
      hard: 'advanced concepts requiring deep knowledge and complex problem-solving'
    };

    return `You are an expert quiz creator. Generate ${request.questionCount} multiple-choice questions about "${request.topic}" at ${request.difficulty} level.

STRICT REQUIREMENTS:
1. Each question must test ${difficultyDescriptions[request.difficulty]}
2. Provide exactly 4 options (A, B, C, D) for each question
3. Only ONE option should be correct
4. Keep explanations SHORT - maximum 2-3 sentences
5. Questions must be clear, factual, and unambiguous
6. Avoid overly complex or trick questions
7. Base questions on well-established, verifiable facts only

EXPLANATION RULES:
- Maximum 2-3 sentences per explanation
- State only the core reason why the answer is correct
- Be direct and concise
- Do NOT include unnecessary details or tangents
- Focus on the key concept being tested

RESPONSE FORMAT (STRICT JSON):
{
  "questions": [
    {
      "question": "Clear, concise question text?",
      "options": {
        "A": "Short option text",
        "B": "Short option text", 
        "C": "Short option text",
        "D": "Short option text"
      },
      "correct_answer": "A",
      "explanation": "Brief explanation in 2-3 sentences maximum."
    }
  ]
}

Topic: ${request.topic}
Difficulty: ${request.difficulty}
Number of questions: ${request.questionCount}

CRITICAL INSTRUCTIONS:
- Return ONLY valid, complete JSON
- NO markdown formatting or code blocks
- Keep ALL text concise to prevent truncation
- Each explanation must be under 100 words
- Ensure JSON is properly closed with all brackets and braces`;
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
};