import axios from 'axios';
import { type Question, type Answer, type QuizResult, type UserInfo, type AttemptRecord } from '../../types/quiz.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔗 Environment Variables:');
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  - Final API_BASE_URL:', API_BASE_URL);

export const quizApi = {
  // Fetch all questions for a quiz
  getQuestions: async (quizId: number): Promise<Question[]> => {
    const url = `${API_BASE_URL}/quiz/${quizId}/questions`;
    console.log('📥 Fetching questions from:', url);
    try {
      const response = await axios.get(url);
      console.log('✅ Questions fetched successfully:', response.data.questions?.length || 0, 'questions');
      return response.data.questions;
    } catch (error) {
      console.error('❌ Failed to fetch questions:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  },

  // Submit quiz answers
  submitQuiz: async (
    quizId: number,
    answers: Answer[],
    includeDetails: boolean = false,
    user?: UserInfo
  ): Promise<QuizResult> => {
    const response = await axios.post(
      `${API_BASE_URL}/quiz/${quizId}/submit${includeDetails ? '?details=true' : ''}`,
      user ? { user, answers } : { answers }
    );
    return response.data;
  },

  // Get attempts for a user (optionally by quiz)
  getAttempts: async (email: string, quizId?: number): Promise<AttemptRecord[]> => {
    const params = new URLSearchParams({ email });
    if (quizId) params.append('quizId', String(quizId));
    const response = await axios.get(`${API_BASE_URL}/quiz/attempts?${params.toString()}`);
    return response.data.attempts;
  },

  // List quizzes (optionally by category)
  listQuizzes: async (
    category?: string,
    level?: string
  ): Promise<{ id: number; title: string; description: string; category: string | null; level: string | null }[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (level) params.append('level', level);
    const response = await axios.get(`${API_BASE_URL}/quizzes${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data.quizzes;
  },
  // Admin: create quiz
  createQuiz: async (payload: { title: string; description?: string; category: string; level: string }): Promise<{ id: number }> => {
    const response = await axios.post(`${API_BASE_URL}/quizzes`, payload);
    return response.data;
  },

  // Admin: add question
  addQuestion: async (
    quizId: number,
    payload: { question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: 'A'|'B'|'C'|'D' }
  ): Promise<{ id: number }> => {
    const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/questions`, payload);
    return response.data;
  },

  // Leaderboard for a quiz
  getLeaderboard: async (
    quizId: number,
    limit: number = 10
  ): Promise<Array<{ rank: number; username: string; email: string; score_percentage: number; correct_answers: number; total_questions: number; created_at: string }>> => {
    const response = await axios.get(`${API_BASE_URL}/quiz/${quizId}/leaderboard?limit=${limit}`);
    return response.data.leaderboard;
  }
};