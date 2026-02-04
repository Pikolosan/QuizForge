import { db } from '../config/db'
import { Question, QuestionResponse, QuizSubmission, QuizResult, UserInfo, AttemptRecord } from '../models/quizmodel';
import { getGeminiService } from './geminiService';
import { AIQuizRequest } from '../schemas/aiQuizSchema';

/**
 * Quiz domain logic: data access + scoring.
 */
export class QuizService {
  /** Upsert user by email; returns user id. */
  static upsertUser(user: UserInfo): Promise<number> {
    return new Promise((resolve, reject) => {
      const findSql = 'SELECT id FROM users WHERE email = ?';
      db.get(findSql, [user.email], (findErr, row: { id: number } | undefined) => {
        if (findErr) {
          reject(findErr);
          return;
        }
        if (row && typeof row.id === 'number') {
          // Update username if changed
          const updateSql = 'UPDATE users SET username = ? WHERE id = ?';
          db.run(updateSql, [user.username, row.id], (updErr) => {
            if (updErr) {
              reject(updErr);
              return;
            }
            resolve(row.id);
          });
          return;
        }
        const insertSql = 'INSERT INTO users (username, email) VALUES (?, ?)';
        db.run(insertSql, [user.username, user.email], function (insErr) {
          if (insErr) {
            reject(insErr);
            return;
          }
          resolve(this.lastID);
        });
      });
    });
  }
  /** Fetch questions for a quiz (no correct answers). */
  static getQuestions(quizId: number): Promise<QuestionResponse[]> {
    return new Promise((resolve, reject) => {
      const query = `SELECT id, question_text, option_a, option_b, option_c, option_d 
                     FROM questions WHERE quiz_id = ?`;
      
      db.all(query, [quizId], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const questions: QuestionResponse[] = rows.map((row) => ({
          id: row.id,
          question_text: row.question_text,
          options: {
            A: row.option_a,
            B: row.option_b,
            C: row.option_c,
            D: row.option_d,
          },
        }));

        resolve(questions);
      });
    });
  }

  /** Fetch questions with explanations for results display */
  static getQuestionsWithExplanations(quizId: number): Promise<Array<{
    id: number;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    correct_option: string;
    explanation?: string;
  }>> {
    return new Promise((resolve, reject) => {
      const query = `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation 
                     FROM questions WHERE quiz_id = ?`;
      
      db.all(query, [quizId], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const questions = rows.map((row) => ({
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

        resolve(questions);
      });
    });
  }

  /** List quizzes, optionally filtered by category. */
  static listQuizzes(category?: string, level?: string): Promise<{ id: number; title: string; description: string; category: string | null; level: string | null }[]> {
    return new Promise((resolve, reject) => {
      const base = `SELECT id, title, description, category, level FROM quizzes`;
      let where = [] as string[];
      const params = [] as any[];
      if (category) { where.push('category = ?'); params.push(category); }
      if (level) { where.push('level = ?'); params.push(level); }
      const sql = where.length ? `${base} WHERE ${where.join(' AND ')} ORDER BY created_at DESC` : `${base} ORDER BY created_at DESC`;
      db.all(sql, params, (err, rows: { id: number; title: string; description: string; category: string | null; level: string | null }[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /** Score a submission and optionally include per-question details. */
  static calculateScore(quizId: number, submission: QuizSubmission, includeDetails: boolean = false): Promise<QuizResult> {
    return new Promise((resolve, reject) => {
      const query = `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation 
                     FROM questions WHERE quiz_id = ?`;
      
      db.all(query, [quizId], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        if (rows.length === 0) {
          reject(new Error('No questions found for this quiz'));
          return;
        }

        let correctCount = 0;
        const details = [];

        // Quick lookup for user answers
        const answerMap = new Map(
          submission.answers.map((a) => [a.question_id, a.selected_option])
        );

        for (const question of rows) {
          const userAnswer = answerMap.get(question.id);
          const isCorrect = userAnswer === question.correct_option;

          if (isCorrect) {
            correctCount++;
          }

          if (includeDetails) {
            const optionKey = `option_${question.correct_option.toLowerCase()}`;
            const userOptionKey = userAnswer ? `option_${userAnswer.toLowerCase()}` : null;

            details.push({
              question_id: question.id,
              question_text: question.question_text,
              user_answer: userAnswer && userOptionKey ? String(question[userOptionKey]) : 'Not answered',
              correct_answer: String(question[optionKey]),
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

        if (includeDetails) {
          result.details = details;
        }

        resolve(result);
      });
    });
  }

  /** Record an attempt for a user+quiz. Returns attempt id. */
  static recordAttempt(userId: number, quizId: number, result: QuizResult): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO attempts (user_id, quiz_id, total_questions, correct_answers, score_percentage)
                   VALUES (?, ?, ?, ?, ?)`;
      db.run(
        sql,
        [userId, quizId, result.total_questions, result.correct_answers, result.score_percentage],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }

  /** Fetch attempts for a given user and quiz. */
  static getAttempts(userEmail: string, quizId?: number): Promise<AttemptRecord[]> {
    return new Promise((resolve, reject) => {
      const sqlBase = `
        SELECT a.id, a.user_id, a.quiz_id, a.total_questions, a.correct_answers, a.score_percentage, a.created_at
        FROM attempts a
        JOIN users u ON u.id = a.user_id
        WHERE u.email = ?
      `;
      const params: any[] = [userEmail];
      const sql = quizId ? sqlBase + ' AND a.quiz_id = ? ORDER BY a.created_at DESC' : sqlBase + ' ORDER BY a.created_at DESC';
      if (quizId) params.push(quizId);
      db.all(sql, params, (err, rows: AttemptRecord[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /** Check if a quiz exists by ID. */
  static quizExists(quizId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM quizzes WHERE id = ?', [quizId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      });
    });
  }

  /** Leaderboard for a quiz: highest score first, newest first on ties */
  static getLeaderboard(quizId: number, limit: number = 10): Promise<Array<{
    rank: number;
    username: string;
    email: string;
    score_percentage: number;
    correct_answers: number;
    total_questions: number;
    created_at: string;
  }>> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.username, u.email, a.score_percentage, a.correct_answers, a.total_questions, a.created_at
        FROM attempts a
        JOIN users u ON u.id = a.user_id
        WHERE a.quiz_id = ?
        ORDER BY a.score_percentage DESC, a.created_at DESC
        LIMIT ?`;

      db.all(sql, [quizId, limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        const ranked = (rows || []).map((r, idx) => ({
          rank: idx + 1,
          username: r.username,
          email: r.email,
          score_percentage: r.score_percentage,
          correct_answers: r.correct_answers,
          total_questions: r.total_questions,
          created_at: r.created_at,
        }));
        resolve(ranked);
      });
    });
  }

  /** Generate AI quiz using Gemini AI */
  static async generateAIQuiz(topic: string, difficulty: string, questionCount: number): Promise<number> {
    try {
      // Validate input using Zod
      const request: AIQuizRequest = {
        topic,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        questionCount
      };
      
      // Get AI-generated questions
      const geminiService = getGeminiService();
      const aiResponse = await geminiService.generateQuizQuestions(request);
      
      // Create the quiz in database
      const quizId = await QuizService.createQuizWithAIQuestions(topic, difficulty, aiResponse.questions);
      
      return quizId;
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      throw error;
    }
  }

  /** Create quiz and insert AI-generated questions */
  private static async createQuizWithAIQuestions(topic: string, difficulty: string, questions: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      // First create the quiz
      const title = `AI Assessment: ${topic} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
      const description = `AI-generated ${difficulty} level assessment on ${topic}`;
      
      const createQuizSql = `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`;
      db.run(createQuizSql, [title, description, 'ai-generated', difficulty], function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        const quizId = this.lastID;
        
        // Insert all AI-generated questions
        const insertPromises = questions.map(q => {
          return new Promise<void>((resolveQ, rejectQ) => {
            const insertQuestionSql = `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertQuestionSql, [
              quizId, 
              q.question, 
              q.options.A, 
              q.options.B, 
              q.options.C, 
              q.options.D, 
              q.correct_answer,
              q.explanation
            ], (qErr) => {
              if (qErr) {
                rejectQ(qErr);
                return;
              }
              resolveQ();
            });
          });
        });
        
        Promise.all(insertPromises)
          .then(() => resolve(quizId))
          .catch(reject);
      });
    });
  }

  /** Fallback to static questions if AI fails */
  static async generateStaticQuiz(topic: string, difficulty: string, questionCount: number): Promise<number> {
    return new Promise((resolve, reject) => {
      // First create the quiz
      const title = `Assessment: ${topic} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
      const description = `${difficulty} level assessment on ${topic}`;
      
      const createQuizSql = `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`;
      db.run(createQuizSql, [title, description, 'static-generated', difficulty], function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        const quizId = this.lastID;
        const questions = QuizService.generateStaticQuestions(topic, difficulty, questionCount);
        
        // Insert all questions
        const insertPromises = questions.map(q => {
          return new Promise<void>((resolveQ, rejectQ) => {
            const insertQuestionSql = `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertQuestionSql, [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option], (qErr) => {
              if (qErr) {
                rejectQ(qErr);
                return;
              }
              resolveQ();
            });
          });
        });
        
        Promise.all(insertPromises)
          .then(() => resolve(quizId))
          .catch(reject);
      });
    });
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