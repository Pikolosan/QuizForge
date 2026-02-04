import request from 'supertest';
import app from '../server';
import { QuizService } from '../services/quizservice';

describe('Quiz API Tests', () => {
  const quizId = 1;

  describe('GET /api/quiz/:quizId/questions', () => {
    it('should fetch all questions without correct answers', async () => {
      const response = await request(app).get(`/api/quiz/${quizId}/questions`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);

      if (response.body.questions.length > 0) {
        const question = response.body.questions[0];
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question_text');
        expect(question).toHaveProperty('options');
        expect(question).not.toHaveProperty('correct_option');
      }
    });

    it('should return 404 for non-existent quiz', async () => {
      const response = await request(app).get('/api/quiz/9999/questions');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/quiz/:quizId/submit', () => {
    it('should calculate score correctly for all correct answers', async () => {
      const submission = {
        answers: [
          { question_id: 1, selected_option: 'B' },
          { question_id: 2, selected_option: 'A' },
          { question_id: 3, selected_option: 'C' },
          { question_id: 4, selected_option: 'D' },
          { question_id: 5, selected_option: 'B' },
        ],
      };

      const response = await request(app)
        .post(`/api/quiz/${quizId}/submit`)
        .send(submission);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_questions', 5);
      expect(response.body).toHaveProperty('correct_answers', 5);
      expect(response.body).toHaveProperty('score_percentage', 100);
    });

    it('should calculate score correctly for partial correct answers', async () => {
      const submission = {
        answers: [
          { question_id: 1, selected_option: 'B' }, // correct
          { question_id: 2, selected_option: 'B' }, // wrong
          { question_id: 3, selected_option: 'C' }, // correct
        ],
      };

      const response = await request(app)
        .post(`/api/quiz/${quizId}/submit`)
        .send(submission);

      expect(response.status).toBe(200);
      expect(response.body.correct_answers).toBe(2);
    });

    it('should return details when requested', async () => {
      const submission = {
        answers: [
          { question_id: 1, selected_option: 'A' },
        ],
      };

      const response = await request(app)
        .post(`/api/quiz/${quizId}/submit?details=true`)
        .send(submission);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
      if (response.body.details.length > 0) {
        expect(response.body.details[0]).toHaveProperty('is_correct');
        expect(response.body.details[0]).toHaveProperty('user_answer');
        expect(response.body.details[0]).toHaveProperty('correct_answer');
      }
    });

    it('should return 400 for invalid submission format', async () => {
      const response = await request(app)
        .post(`/api/quiz/${quizId}/submit`)
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
    });
  });
});