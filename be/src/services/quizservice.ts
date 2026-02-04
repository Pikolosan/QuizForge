import { getGeminiService } from './geminiService';
import { AIQuizRequest } from '../schemas/aiQuizSchema';
import { QuizModel, QuestionModel, UserModel, AttemptModel } from '../models/mongoModels';
import { getNextSequence } from '../config/db';
import { QuestionResponse, QuizSubmission, QuizResult, UserInfo, AttemptRecord } from '../models/quizmodel';

/**
 * Quiz domain logic: now backed by MongoDB (mongoose)
 */
export class QuizService {
  /** Upsert user by email; returns user id. */
  static async upsertUser(user: UserInfo): Promise<number> {
    const existing = await UserModel.findOne({ email: user.email }).exec();
    if (existing) {
      if (existing.username !== user.username) {
        existing.username = user.username;
        await existing.save();
      }
      return existing.id;
    }
    const id = await getNextSequence('users');
    const created = await UserModel.create({ id, username: user.username, email: user.email });
    return created.id;
  }

  /** Fetch questions for a quiz (no correct answers). */
  static async getQuestions(quizId: number): Promise<QuestionResponse[]> {
    const rows = await QuestionModel.find({ quiz_id: quizId }).select('id question_text option_a option_b option_c option_d -_id').exec();
    return rows.map((row: any) => ({
      id: row.id,
      question_text: row.question_text,
      options: {
        A: row.option_a,
        B: row.option_b,
        C: row.option_c,
        D: row.option_d,
      }
    }));
  }

  /** Fetch questions with explanations for results display */
  static async getQuestionsWithExplanations(quizId: number) {
    const rows = await QuestionModel.find({ quiz_id: quizId }).select('id question_text option_a option_b option_c option_d correct_option explanation -_id').exec();
    return rows.map((row: any) => ({
      id: row.id,
      question_text: row.question_text,
      options: {
        A: row.option_a,
        B: row.option_b,
        C: row.option_c,
        D: row.option_d,
      },
      correct_option: row.correct_option,
      explanation: row.explanation,
    }));
  }

  /** List quizzes, optionally filtered by category/level. */
  static async listQuizzes(category?: string, level?: string) {
    const filter: any = {};
    if (category) filter.category = category;
    if (level) filter.level = level;
    const rows = await QuizModel.find(filter).sort({ created_at: -1 }).select('id title description category level -_id').exec();
    return rows;
  }

  /** Score a submission and optionally include per-question details. */
  static async calculateScore(quizId: number, submission: QuizSubmission, includeDetails: boolean = false): Promise<QuizResult> {
    const rows = await QuestionModel.find({ quiz_id: quizId }).exec();

    if (!rows || rows.length === 0) throw new Error('No questions found for this quiz');

    let correctCount = 0;
    const details: any[] = [];

    const answerMap = new Map(submission.answers.map((a) => [a.question_id, a.selected_option]));

    for (const question of rows) {
      const userAnswer = answerMap.get(question.id);
      const isCorrect = userAnswer === question.correct_option;
      if (isCorrect) correctCount++;

      if (includeDetails) {
        const optionKey = `option_${question.correct_option.toLowerCase()}`;
        const userOptionKey = userAnswer ? `option_${userAnswer.toLowerCase()}` : null;
        details.push({
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer && userOptionKey ? (question as any)[userOptionKey] : 'Not answered',
          correct_answer: (question as any)[optionKey],
          is_correct: isCorrect,
          explanation: question.explanation || undefined,
        });
      }
    }

    const result: QuizResult = {
      total_questions: rows.length,
      correct_answers: correctCount,
      score_percentage: Math.round((correctCount / rows.length) * 100),
    };

    if (includeDetails) result.details = details;

    return result;
  }

  /** Record an attempt for a user+quiz. Returns attempt id. */
  static async recordAttempt(userId: number, quizId: number, result: QuizResult): Promise<number> {
    const id = await getNextSequence('attempts');
    const created = await AttemptModel.create({ id, user_id: userId, quiz_id: quizId, total_questions: result.total_questions, correct_answers: result.correct_answers, score_percentage: result.score_percentage });
    return created.id;
  }

  /** Fetch attempts for a given user and quiz. */
  static async getAttempts(userEmail: string, quizId?: number): Promise<AttemptRecord[]> {
    const user = await UserModel.findOne({ email: userEmail }).exec();
    if (!user) return [];
    const filter: any = { user_id: user.id };
    if (quizId) filter.quiz_id = quizId;
    const rows = await AttemptModel.find(filter).sort({ created_at: -1 }).exec();
    return rows as any;
  }

  /** Check if a quiz exists by ID. */
  static async quizExists(quizId: number): Promise<boolean> {
    const q = await QuizModel.findOne({ id: quizId }).exec();
    return !!q;
  }

  /** Leaderboard for a quiz: highest score first, newest first on ties */
  static async getLeaderboard(quizId: number, limit: number = 10) {
    // Use aggregation to join attempts with users
    const pipeline = [
      { $match: { quiz_id: quizId } },
      { $sort: { score_percentage: -1, created_at: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { username: '$user.username', email: '$user.email', score_percentage: 1, correct_answers: 1, total_questions: 1, created_at: 1 } }
    ];

    const rows: any[] = await AttemptModel.aggregate(pipeline as any).exec();
    return rows.map((r, idx) => ({ rank: idx + 1, username: r.username, email: r.email, score_percentage: r.score_percentage, correct_answers: r.correct_answers, total_questions: r.total_questions, created_at: r.created_at }));
  }

  /** Generate AI quiz using Gemini AI */
  static async generateAIQuiz(topic: string, difficulty: string, questionCount: number): Promise<number> {
    const request: AIQuizRequest = { topic, difficulty: difficulty as 'easy'|'medium'|'hard', questionCount };
    const geminiService = getGeminiService();
    const aiResponse = await geminiService.generateQuizQuestions(request);
    const quizId = await QuizService.createQuizWithAIQuestions(topic, difficulty, aiResponse.questions);
    return quizId;
  }

  /** Create quiz and insert AI-generated questions */
  private static async createQuizWithAIQuestions(topic: string, difficulty: string, questions: any[]): Promise<number> {
    const title = `AI Assessment: ${topic} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
    const description = `AI-generated ${difficulty} level assessment on ${topic}`;
    const id = await getNextSequence('quizzes');
    await QuizModel.create({ id, title, description, category: 'ai-generated', level: difficulty });

    const qPromises = questions.map(async (q: any) => {
      const qId = await getNextSequence('questions');
      await QuestionModel.create({ id: qId, quiz_id: id, question_text: q.question, option_a: q.options.A, option_b: q.options.B, option_c: q.options.C, option_d: q.options.D, correct_option: q.correct_answer, explanation: q.explanation });
    });
    await Promise.all(qPromises);
    return id;
  }

  /** Fallback to static questions if AI fails */
  static async generateStaticQuiz(topic: string, difficulty: string, questionCount: number): Promise<number> {
    const title = `Assessment: ${topic} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
    const description = `${difficulty} level assessment on ${topic}`;
    const id = await getNextSequence('quizzes');
    await QuizModel.create({ id, title, description, category: 'static-generated', level: difficulty });

    const questions = QuizService.generateStaticQuestions(topic, difficulty, questionCount);
    const qPromises = questions.map(async (q) => {
      const qId = await getNextSequence('questions');
      await QuestionModel.create({ id: qId, quiz_id: id, question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option });
    });
    await Promise.all(qPromises);
    return id;
  }

  /** Create a quiz manually (admin/admin panel) */
  static async createQuiz(title: string, description: string, category: string, level: string): Promise<number> {
    const id = await getNextSequence('quizzes');
    const created = await QuizModel.create({ id, title, description: description || '', category, level });
    return created.id;
  }

  /** Add a question to an existing quiz */
  static async addQuestion(quizId: number, payload: { question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string }): Promise<number> {
    // Ensure quiz exists
    const quiz = await QuizModel.findOne({ id: quizId }).exec();
    if (!quiz) throw new Error('Quiz not found');
    const qId = await getNextSequence('questions');
    const created = await QuestionModel.create({ id: qId, quiz_id: quizId, question_text: payload.question_text, option_a: payload.option_a, option_b: payload.option_b, option_c: payload.option_c, option_d: payload.option_d, correct_option: payload.correct_option });
    return created.id;
  }

  /** Generate static questions based on topic and difficulty */
  private static generateStaticQuestions(topic: string, difficulty: string, count: number): Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
  }> {
    const questions = QuizService.getQuestionBank(topic, difficulty);
    
    // Shuffle and select required number of questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, questions.length));
    
    // If we need more questions than available, cycle through them
    while (selected.length < count) {
      const needed = count - selected.length;
      const additional = shuffled.slice(0, Math.min(needed, shuffled.length));
      selected.push(...additional);
    }
    
    return selected.slice(0, count);
  }

  /** Static question bank organized by topic and difficulty */
  private static getQuestionBank(topic: string, difficulty: string): Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
  }> {
    const topicKey = topic.toLowerCase().replace(/\s+/g, '');
    const questions = QuizService.questionDatabase[topicKey]?.[difficulty] || QuizService.questionDatabase['general'][difficulty];
    
    return questions || [];
  }

  /** Static question database */
  private static questionDatabase: {[key: string]: {[key: string]: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
  }>}} = {
    'javascriptfundamentals': {
      'easy': [
        {
          question_text: "What is the correct way to declare a variable in JavaScript?",
          option_a: "var myVariable;",
          option_b: "variable myVariable;",
          option_c: "v myVariable;",
          option_d: "declare myVariable;",
          correct_option: "A"
        },
        {
          question_text: "Which of the following is NOT a JavaScript data type?",
          option_a: "string",
          option_b: "boolean",
          option_c: "integer",
          option_d: "undefined",
          correct_option: "C"
        },
        {
          question_text: "How do you write a comment in JavaScript?",
          option_a: "<!-- This is a comment -->",
          option_b: "// This is a comment",
          option_c: "# This is a comment",
          option_d: "** This is a comment **",
          correct_option: "B"
        },
        {
          question_text: "What will console.log(typeof null) output?",
          option_a: "null",
          option_b: "undefined",
          option_c: "object",
          option_d: "boolean",
          correct_option: "C"
        },
        {
          question_text: "Which operator is used for strict equality comparison?",
          option_a: "==",
          option_b: "===",
          option_c: "=",
          option_d: "!=",
          correct_option: "B"
        }
      ],
      'medium': [
        {
          question_text: "What is the result of 'hello'.charAt(1)?",
          option_a: "h",
          option_b: "e",
          option_c: "l",
          option_d: "o",
          correct_option: "B"
        },
        {
          question_text: "Which method adds an element to the end of an array?",
          option_a: "append()",
          option_b: "push()",
          option_c: "add()",
          option_d: "insert()",
          correct_option: "B"
        },
        {
          question_text: "What does the 'this' keyword refer to in JavaScript?",
          option_a: "The current function",
          option_b: "The global object",
          option_c: "The object that is executing the current function",
          option_d: "The previous object",
          correct_option: "C"
        },
        {
          question_text: "What is a closure in JavaScript?",
          option_a: "A way to close a function",
          option_b: "A function that has access to variables in its outer scope",
          option_c: "A method to end a loop",
          option_d: "A type of error",
          correct_option: "B"
        },
        {
          question_text: "What will [1, 2, 3].map(x => x * 2) return?",
          option_a: "[1, 2, 3]",
          option_b: "[2, 4, 6]",
          option_c: "[1, 4, 9]",
          option_d: "6",
          correct_option: "B"
        }
      ],
      'hard': [
        {
          question_text: "What is the output of console.log(1 + '2' + 3)?",
          option_a: "6",
          option_b: "123",
          option_c: "15",
          option_d: "NaN",
          correct_option: "B"
        },
        {
          question_text: "What is event delegation in JavaScript?",
          option_a: "Assigning events to multiple elements",
          option_b: "Using a parent element to handle events for its children",
          option_c: "Removing event listeners",
          option_d: "Creating custom events",
          correct_option: "B"
        },
        {
          question_text: "What is the difference between call() and apply()?",
          option_a: "call() is faster than apply()",
          option_b: "apply() accepts an array of arguments, call() accepts individual arguments",
          option_c: "There is no difference",
          option_d: "call() is for methods, apply() is for functions",
          correct_option: "B"
        },
        {
          question_text: "What is a Promise in JavaScript?",
          option_a: "A guarantee that code will execute",
          option_b: "An object representing eventual completion of an asynchronous operation",
          option_c: "A way to create functions",
          option_d: "A method to handle errors",
          correct_option: "B"
        },
        {
          question_text: "What does the spread operator (...) do?",
          option_a: "Combines arrays",
          option_b: "Expands iterables into individual elements",
          option_c: "Creates a copy of an object",
          option_d: "All of the above",
          correct_option: "D"
        }
      ]
    },
    'reactdevelopment': {
      'easy': [
        {
          question_text: "What is React?",
          option_a: "A JavaScript library for building user interfaces",
          option_b: "A database",
          option_c: "A server framework",
          option_d: "A CSS framework",
          correct_option: "A"
        },
        {
          question_text: "What is JSX?",
          option_a: "A JavaScript extension",
          option_b: "A syntax extension to JavaScript",
          option_c: "A new programming language",
          option_d: "A CSS preprocessor",
          correct_option: "B"
        },
        {
          question_text: "How do you create a React component?",
          option_a: "function MyComponent() {}",
          option_b: "class MyComponent extends React.Component {}",
          option_c: "const MyComponent = () => {}",
          option_d: "All of the above",
          correct_option: "D"
        },
        {
          question_text: "What is the virtual DOM?",
          option_a: "A copy of the real DOM kept in memory",
          option_b: "A new type of DOM",
          option_c: "A server-side DOM",
          option_d: "A CSS framework",
          correct_option: "A"
        },
        {
          question_text: "How do you pass data to a React component?",
          option_a: "Through props",
          option_b: "Through state",
          option_c: "Through context",
          option_d: "Through methods",
          correct_option: "A"
        }
      ],
      'medium': [
        {
          question_text: "What is the useState hook used for?",
          option_a: "To manage component state",
          option_b: "To handle side effects",
          option_c: "To create context",
          option_d: "To handle routing",
          correct_option: "A"
        },
        {
          question_text: "When does useEffect run?",
          option_a: "Before component mounts",
          option_b: "After component renders",
          option_c: "Only on component unmount",
          option_d: "Never",
          correct_option: "B"
        },
        {
          question_text: "What is the key prop used for in React lists?",
          option_a: "Styling",
          option_b: "Event handling",
          option_c: "Helping React identify which items have changed",
          option_d: "Data validation",
          correct_option: "C"
        },
        {
          question_text: "What is React.memo()?",
          option_a: "A memory management tool",
          option_b: "A higher-order component for performance optimization",
          option_c: "A state management library",
          option_d: "A routing solution",
          correct_option: "B"
        },
        {
          question_text: "How do you handle events in React?",
          option_a: "Using addEventListener",
          option_b: "Using SyntheticEvents",
          option_c: "Using jQuery",
          option_d: "Using vanilla JavaScript",
          correct_option: "B"
        }
      ],
      'hard': [
        {
          question_text: "What is the difference between useCallback and useMemo?",
          option_a: "useCallback memoizes functions, useMemo memoizes values",
          option_b: "They are the same",
          option_c: "useCallback is for components, useMemo is for functions",
          option_d: "useMemo is deprecated",
          correct_option: "A"
        },
        {
          question_text: "What is a React portal?",
          option_a: "A way to render children into a DOM node outside the parent component",
          option_b: "A routing mechanism",
          option_c: "A state management pattern",
          option_d: "A testing utility",
          correct_option: "A"
        },
        {
          question_text: "What is the Context API used for?",
          option_a: "Component styling",
          option_b: "Prop drilling avoidance and global state management",
          option_c: "HTTP requests",
          option_d: "Component lifecycle",
          correct_option: "B"
        },
        {
          question_text: "What is React Suspense?",
          option_a: "A way to handle loading states declaratively",
          option_b: "A testing library",
          option_c: "A routing solution",
          option_d: "A state management tool",
          correct_option: "A"
        },
        {
          question_text: "What is the purpose of React.forwardRef()?",
          option_a: "To forward props to child components",
          option_b: "To forward refs through component hierarchy",
          option_c: "To handle form submissions",
          option_d: "To manage component state",
          correct_option: "B"
        }
      ]
    },
    'general': {
      'easy': [
        {
          question_text: "What does HTML stand for?",
          option_a: "Hyper Text Markup Language",
          option_b: "Home Tool Markup Language",
          option_c: "Hyperlinks and Text Markup Language",
          option_d: "Hyperlinking Text Marking Language",
          correct_option: "A"
        },
        {
          question_text: "Which CSS property is used to change the text color?",
          option_a: "font-color",
          option_b: "text-color",
          option_c: "color",
          option_d: "text-style",
          correct_option: "C"
        },
        {
          question_text: "What is the purpose of the DOCTYPE declaration?",
          option_a: "To specify the HTML version",
          option_b: "To include CSS",
          option_c: "To add JavaScript",
          option_d: "To create comments",
          correct_option: "A"
        }
      ],
      'medium': [
        {
          question_text: "What is the box model in CSS?",
          option_a: "A way to create boxes",
          option_b: "The rectangular space around an element including content, padding, border, and margin",
          option_c: "A layout technique",
          option_d: "A CSS framework",
          correct_option: "B"
        },
        {
          question_text: "What is the difference between margin and padding?",
          option_a: "Margin is inside the element, padding is outside",
          option_b: "Padding is inside the element, margin is outside",
          option_c: "They are the same",
          option_d: "Margin affects text, padding affects layout",
          correct_option: "B"
        }
      ],
      'hard': [
        {
          question_text: "What is a closure in programming?",
          option_a: "A way to close programs",
          option_b: "A function that retains access to variables from its lexical scope",
          option_c: "A type of loop",
          option_d: "A debugging technique",
          correct_option: "B"
        },
        {
          question_text: "What is the difference between synchronous and asynchronous programming?",
          option_a: "Synchronous runs in parallel, asynchronous runs sequentially",
          option_b: "Asynchronous runs in parallel, synchronous runs sequentially",
          option_c: "They are the same",
          option_d: "Synchronous is faster",
          correct_option: "B"
        }
      ]
    }
  };
}