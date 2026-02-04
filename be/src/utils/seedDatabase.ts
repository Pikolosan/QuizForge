import { connectMongo, getNextSequence } from '../config/db';
import { QuizModel, QuestionModel } from '../models/mongoModels';

/**
 * Seed the MongoDB with starter quizzes and questions.
 */
const seedData = async () => {
  await connectMongo();

  // Helper to create quiz + questions
  const createQuiz = async (title: string, description: string, category: string, level: string, questions: any[] = []) => {
    const id = await getNextSequence('quizzes');
    await QuizModel.create({ id, title, description, category, level });

    const qPromises = questions.map(async (q) => {
      const qId = await getNextSequence('questions');
      await QuestionModel.create({ id: qId, quiz_id: id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d, correct_option: q.correct });
    });

    await Promise.all(qPromises);
    console.log(`${title} seeded with ${questions.length} questions (id=${id})`);
  };

  try {
    await createQuiz('JavaScript Basics', 'Test your knowledge of JavaScript fundamentals', 'javascript', 'basic', [
      { text: 'What is the output of: typeof null?', a: 'null', b: 'object', c: 'undefined', d: 'number', correct: 'B' },
      { text: 'Which method is used to add elements to the end of an array?', a: 'push()', b: 'pop()', c: 'shift()', d: 'unshift()', correct: 'A' },
      { text: 'What does "===" check in JavaScript?', a: 'Only value', b: 'Only type', c: 'Both value and type', d: 'Neither value nor type', correct: 'C' },
      { text: 'Which keyword is used to declare a block-scoped variable?', a: 'var', b: 'let', c: 'const', d: 'Both b and c', correct: 'D' },
      { text: 'What is a closure in JavaScript?', a: 'A function with no parameters', b: 'A function that has access to its outer scope', c: 'A method to close the browser', d: 'A way to end a loop', correct: 'B' }
    ]);

    await createQuiz('TypeScript Basics', 'Strengthen your TypeScript fundamentals', 'typescript', 'basic', [
      { text: 'Which symbol annotates variable type?', a: ':', b: '->', c: '=>', d: '#', correct: 'A' },
      { text: 'Which type represents absence of value?', a: 'any', b: 'void', c: 'unknown', d: 'never', correct: 'B' },
      { text: 'Which type is safer than any for unknown inputs?', a: 'unknown', b: 'void', c: 'never', d: 'object', correct: 'A' },
      { text: 'What utility makes all props optional?', a: 'Pick', b: 'Partial', c: 'Required', d: 'Readonly', correct: 'B' }
    ]);

    await createQuiz('React Basics', 'Assess your React knowledge', 'react', 'basic', [
      { text: 'What does JSX compile to?', a: 'HTML', b: 'JavaScript', c: 'TypeScript', d: 'XML', correct: 'B' },
      { text: 'Which hook manages state?', a: 'useMemo', b: 'useEffect', c: 'useState', d: 'useRef', correct: 'C' },
      { text: 'Which prop passes children into a component?', a: 'child', b: 'children', c: 'content', d: 'slot', correct: 'B' },
      { text: 'Key helps React with...', a: 'Styling', b: 'Refs', c: 'List diffing', d: 'Hooks', correct: 'C' }
    ]);

    await createQuiz('Next.js Basics', 'Server and routing in Next.js', 'next', 'basic', [
      { text: 'Which folder defines file-based routes?', a: 'routes', b: 'pages', c: 'app', d: 'src', correct: 'B' },
      { text: 'What runs on the server by default in App Router?', a: 'Client Components', b: 'Server Components', c: 'Both', d: 'Neither', correct: 'B' },
      { text: 'Which command creates a new Next app?', a: 'npx create-next-app', b: 'npm init next', c: 'next new', d: 'npx next-create', correct: 'A' }
    ]);

    await createQuiz('JavaScript Advanced', 'Advanced JavaScript patterns and internals', 'javascript', 'advanced');
    await createQuiz('TypeScript Advanced', 'Advanced typing and utilities', 'typescript', 'advanced');
    await createQuiz('React Advanced', 'Concurrent features and performance', 'react', 'advanced');
    await createQuiz('Next.js Advanced', 'Routing, data fetching, and optimization', 'next', 'advanced');

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('Error while seeding MongoDB:', err);
    process.exit(1);
  } finally {
    // we don't forcibly disconnect here to allow server to remain connected if seed called during build/start
  }
};

seedData();