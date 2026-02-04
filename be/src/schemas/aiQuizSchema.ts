import { z } from 'zod';

// Schema for a single MCQ question from AI
export const AIQuestionSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  options: z.object({
    A: z.string().min(1, "Option A is required"),
    B: z.string().min(1, "Option B is required"),
    C: z.string().min(1, "Option C is required"),
    D: z.string().min(1, "Option D is required"),
  }),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(10, "Explanation must be at least 10 characters")
});

// Schema for the complete AI response containing multiple questions
export const AIQuizResponseSchema = z.object({
  questions: z.array(AIQuestionSchema).min(1, "At least one question is required")
});

// Schema for input validation
export const AIQuizRequestSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.number().min(5).max(50)
});

// TypeScript types derived from schemas
export type AIQuestion = z.infer<typeof AIQuestionSchema>;
export type AIQuizResponse = z.infer<typeof AIQuizResponseSchema>;
export type AIQuizRequest = z.infer<typeof AIQuizRequestSchema>;
