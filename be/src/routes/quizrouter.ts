import { Router } from 'express';
import { QuizController } from '../controllers/quizcontroller';

const router = Router();

console.log('🛣️ Setting up quiz routes...');

// Quiz routes mounted under /api
router.get('/quiz/:quizId/questions', QuizController.getQuestions);
router.post('/quiz/:quizId/submit', QuizController.submitQuiz);
router.get('/quiz/attempts', QuizController.getAttempts);
router.get('/quizzes', QuizController.listQuizzes);
router.get('/quiz/:quizId/leaderboard', QuizController.getLeaderboard);
router.post('/quizzes', QuizController.createQuiz);
router.post('/quizzes/:quizId/questions', QuizController.addQuestion);

// AI Assessment route with logging
router.post('/ai-assessment/generate', (req, res, next) => {
  console.log('🎯 AI Assessment route hit!');
  console.log('📝 Method:', req.method);
  console.log('📍 Path:', req.path);
  console.log('🔗 Full URL:', req.originalUrl);
  next();
}, QuizController.generateAIAssessment);

console.log('✅ All quiz routes configured successfully');

export default router;