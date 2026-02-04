import mongoose, { Schema } from 'mongoose';

// Quiz schema
const QuizSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  level: { type: String },
  created_at: { type: Date, default: Date.now }
}, { collection: 'quizzes' });

// Question schema
const QuestionSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  quiz_id: { type: Number, required: true, index: true },
  question_text: { type: String, required: true },
  option_a: { type: String, required: true },
  option_b: { type: String, required: true },
  option_c: { type: String, required: true },
  option_d: { type: String, required: true },
  correct_option: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  explanation: { type: String },
}, { collection: 'questions' });

// User schema
const UserSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'users' });

// Attempt schema
const AttemptSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  user_id: { type: Number, required: true, index: true },
  quiz_id: { type: Number, required: true, index: true },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  score_percentage: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'attempts' });

export const QuizModel = (mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema));
export const QuestionModel = (mongoose.models.Question || mongoose.model('Question', QuestionSchema));
export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema));
export const AttemptModel = (mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema));

export default {
  QuizModel,
  QuestionModel,
  UserModel,
  AttemptModel
};