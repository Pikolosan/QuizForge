import { Request, Response } from 'express';
import { QuizService } from '../services/quizservice';
import { QuizSubmission, UserInfo } from '../models/quizmodel';

/**
 * Quiz endpoints. Validate the basics here and let the service do the heavy lifting.
 */
export class QuizController {
  /**
   * GET /api/quiz/:quizId/questions
   * Sends questions without leaking correct answers.
   */
  static async getQuestions(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.quizId);

      if (isNaN(quizId)) {
        res.status(400).json({ error: 'Invalid quiz ID' });
        return;
      }

      const exists = await QuizService.quizExists(quizId);
      if (!exists) {
        res.status(404).json({ error: 'Quiz not found' });
        return;
      }

      const questions = await QuizService.getQuestions(quizId);
      res.json({ questions });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }

  /**
   * GET /api/quizzes?category=optional
   * Lists available quizzes.
   */
  static async listQuizzes(req: Request, res: Response) {
    try {
      const category = req.query.category ? String(req.query.category) : undefined;
      const level = req.query.level ? String(req.query.level) : undefined;
      const quizzes = await QuizService.listQuizzes(category, level);
      res.json({ quizzes });
    } catch (error) {
      console.error('Error listing quizzes:', error);
      res.status(500).json({ error: 'Failed to list quizzes' });
    }
  }
  /**
   * POST /api/quiz/:quizId/submit
   * Checks the payload and returns a score (details optional).
   */
  static async submitQuiz(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.quizId);
      const submission: QuizSubmission = req.body;
      const user: UserInfo | undefined = req.body?.user;
      const includeDetails = req.query.details === 'true';

      if (isNaN(quizId)) {
        res.status(400).json({ error: 'Invalid quiz ID' });
        return;
      }

      if (!submission.answers || !Array.isArray(submission.answers)) {
        res.status(400).json({ error: 'Invalid submission format' });
        return;
      }

      // Validate each answer
      for (const answer of submission.answers) {
        if (!answer.question_id || !answer.selected_option) {
          res.status(400).json({ error: 'Each answer must have question_id and selected_option' });
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(answer.selected_option)) {
          res.status(400).json({ error: 'Invalid option selected' });
          return;
        }
      }

      const result = await QuizService.calculateScore(quizId, submission, includeDetails);

      // User handling is optional for backward compatibility
      if (user && user.email && user.username) {
        try {
          const userId = await QuizService.upsertUser(user);
          await QuizService.recordAttempt(userId, quizId, result);
        } catch (e) {
          console.error('Failed to record attempt:', e);
          // Do not fail the response if attempt logging fails
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Failed to calculate score' });
    }
  }

  /**
   * GET /api/quiz/attempts?email=...&quizId=optional
   * Returns attempts for a user (filtered by quiz if provided).
   */
  static async getAttempts(req: Request, res: Response) {
    try {
      const email = String(req.query.email || '').trim();
      const quizId = req.query.quizId ? parseInt(String(req.query.quizId)) : undefined;

      if (!email) {
        res.status(400).json({ error: 'email is required' });
        return;
      }
      if (quizId !== undefined && isNaN(quizId)) {
        res.status(400).json({ error: 'Invalid quizId' });
        return;
      }

      const attempts = await QuizService.getAttempts(email, quizId);
      res.json({ attempts });
    } catch (error) {
      console.error('Error fetching attempts:', error);
      res.status(500).json({ error: 'Failed to fetch attempts' });
    }
  }

  /**
   * GET /api/quiz/:quizId/leaderboard?limit=10
   */
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        res.status(400).json({ error: 'Invalid quiz ID' });
        return;
      }
      const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit))) : 10;
      const board = await QuizService.getLeaderboard(quizId, limit);
      res.json({ leaderboard: board });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }
  /**
   * POST /api/quizzes
   * Create a quiz (title, description, category, level)
   */
  static async createQuiz(req: Request, res: Response) {
    try {
      const { title, description, category, level } = req.body || {};
      if (!title || !category || !level) {
        res.status(400).json({ error: 'title, category and level are required' });
        return;
      }
      const sql = `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`;
      const params = [title, description || '', category, level];
      const { db } = await import('../config/db');
      (db as any).run(sql, params, function (this: { lastID: number }, err: any) {
        if (err) {
          res.status(500).json({ error: 'Failed to create quiz' });
          return;
        }
        const lastID = this.lastID;
        res.status(201).json({ id: lastID });
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  }

  /**
   * POST /api/quizzes/:quizId/questions
   * Add a question
   */
  static async addQuestion(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.quizId);
      const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body || {};
      if (isNaN(quizId) || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }
      const sql = `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const params = [quizId, question_text, option_a, option_b, option_c, option_d, correct_option];
      const { db } = await import('../config/db');
      (db as any).run(sql, params, function (this: { lastID: number }, err: any) {
        if (err) {
          res.status(500).json({ error: 'Failed to add question' });
          return;
        }
        const lastID = this.lastID;
        res.status(201).json({ id: lastID });
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add question' });
    }
  }

  /**
   * POST /api/ai-assessment/generate
   * Generate a quiz based on topic, difficulty, and question count using AI
   */
  static async generateAIAssessment(req: Request, res: Response) {
    console.log('🚀 AI Assessment endpoint called');
    console.log('📝 Request body:', req.body);
    console.log('📡 Request headers:', req.headers);
    
    try {
      const { topic, difficulty, questionCount } = req.body || {};
      
      console.log(`📊 Received parameters - Topic: ${topic}, Difficulty: ${difficulty}, Questions: ${questionCount}`);
      
      if (!topic || !difficulty || !questionCount) {
        console.log('❌ Missing required parameters');
        res.status(400).json({ error: 'Topic, difficulty, and questionCount are required' });
        return;
      }

      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        console.log('❌ Invalid difficulty level:', difficulty);
        res.status(400).json({ error: 'Invalid difficulty level' });
        return;
      }

      if (questionCount < 5 || questionCount > 50) {
        console.log('❌ Invalid question count:', questionCount);
        res.status(400).json({ error: 'Question count must be between 5 and 50' });
        return;
      }

      console.log('✅ All parameters validated successfully');
      
      let quizId: number;
      let generationType: string = 'ai';

      try {
        console.log('🤖 Attempting AI quiz generation...');
        // Try to generate quiz using AI first
        quizId = await QuizService.generateAIQuiz(topic, difficulty, questionCount);
        console.log('✅ AI quiz generation successful, Quiz ID:', quizId);
      } catch (aiError) {
        console.warn('⚠️ AI generation failed, falling back to static questions:', aiError);
        
        try {
          console.log('📚 Attempting static quiz generation...');
          // Fallback to static questions
          quizId = await QuizService.generateStaticQuiz(topic, difficulty, questionCount);
          generationType = 'static';
          console.log('✅ Static quiz generation successful, Quiz ID:', quizId);
        } catch (staticError) {
          console.error('❌ Both AI and static generation failed:', staticError);
          res.status(500).json({ error: 'Failed to generate quiz. Please try again later.' });
          return;
        }
      }
      
      const response = { 
        quizId, 
        message: `Quiz generated successfully using ${generationType} generation`,
        generationType 
      };
      
      console.log('📤 Sending response:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Unexpected error in AI assessment generation:', error);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  }
}