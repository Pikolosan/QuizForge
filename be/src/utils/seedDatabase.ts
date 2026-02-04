import { db } from '../config/db';

/**
 * Seed the DB with one sample quiz and a few starter questions.
 */
const seedData = () => {
  db.serialize(() => {
    // Insert multiple quizzes (basic/advanced per category)
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['JavaScript Basics', 'Test your knowledge of JavaScript fundamentals', 'javascript', 'basic'],
      function (err) {
        if (err) {
          console.error('Error inserting quiz:', err);
          return;
        }

        const quizId = this.lastID;
        console.log(`Quiz created with ID: ${quizId}`);

        // Insert questions for JS (basic)
        const questions = [
          {
            text: 'What is the output of: typeof null?',
            a: 'null',
            b: 'object',
            c: 'undefined',
            d: 'number',
            correct: 'B',
          },
          {
            text: 'Which method is used to add elements to the end of an array?',
            a: 'push()',
            b: 'pop()',
            c: 'shift()',
            d: 'unshift()',
            correct: 'A',
          },
          {
            text: 'What does "===" check in JavaScript?',
            a: 'Only value',
            b: 'Only type',
            c: 'Both value and type',
            d: 'Neither value nor type',
            correct: 'C',
          },
          {
            text: 'Which keyword is used to declare a block-scoped variable?',
            a: 'var',
            b: 'let',
            c: 'const',
            d: 'Both b and c',
            correct: 'D',
          },
          {
            text: 'What is a closure in JavaScript?',
            a: 'A function with no parameters',
            b: 'A function that has access to its outer scope',
            c: 'A method to close the browser',
            d: 'A way to end a loop',
            correct: 'B',
          },
          { text: 'Which array method returns a new array with elements that pass a test?', a: 'map', b: 'filter', c: 'reduce', d: 'forEach', correct: 'B' },
          { text: 'Which statement creates a promise?', a: 'new Async()', b: 'new Promise()', c: 'Promise()', d: 'await Promise', correct: 'B' },
        ];

        const stmt = db.prepare(
          `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        questions.forEach((q) => {
          stmt.run(quizId, q.text, q.a, q.b, q.c, q.d, q.correct);
        });

        stmt.finalize();
        console.log(`${questions.length} questions inserted successfully`);
        console.log('JavaScript quiz seeded.');
      }
    );

    // TypeScript quiz (basic)
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['TypeScript Basics', 'Strengthen your TypeScript fundamentals', 'typescript', 'basic'],
      function (err) {
        if (err) {
          console.error('Error inserting TS quiz:', err);
          return;
        }
        const quizId = this.lastID;
        const questions = [
          { text: 'Which symbol annotates variable type?', a: ':', b: '->', c: '=>', d: '#', correct: 'A' },
          { text: 'Which type represents absence of value?', a: 'any', b: 'void', c: 'unknown', d: 'never', correct: 'B' },
          { text: 'Which type is safer than any for unknown inputs?', a: 'unknown', b: 'void', c: 'never', d: 'object', correct: 'A' },
          { text: 'What utility makes all props optional?', a: 'Pick', b: 'Partial', c: 'Required', d: 'Readonly', correct: 'B' },
        ];
        const stmt = db.prepare(
          `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        questions.forEach((q) => stmt.run(quizId, q.text, q.a, q.b, q.c, q.d, q.correct));
        stmt.finalize();
        console.log('TypeScript quiz seeded.');
      }
    );

    // React quiz (basic)
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['React Basics', 'Assess your React knowledge', 'react', 'basic'],
      function (err) {
        if (err) {
          console.error('Error inserting React quiz:', err);
          return;
        }
        const quizId = this.lastID;
        const questions = [
          { text: 'What does JSX compile to?', a: 'HTML', b: 'JavaScript', c: 'TypeScript', d: 'XML', correct: 'B' },
          { text: 'Which hook manages state?', a: 'useMemo', b: 'useEffect', c: 'useState', d: 'useRef', correct: 'C' },
          { text: 'Which prop passes children into a component?', a: 'child', b: 'children', c: 'content', d: 'slot', correct: 'B' },
          { text: 'Key helps React with...', a: 'Styling', b: 'Refs', c: 'List diffing', d: 'Hooks', correct: 'C' },
        ];
        const stmt = db.prepare(
          `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        questions.forEach((q) => stmt.run(quizId, q.text, q.a, q.b, q.c, q.d, q.correct));
        stmt.finalize();
        console.log('React quiz seeded.');
      }
    );

    // Next.js quiz (basic)
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['Next.js Basics', 'Server and routing in Next.js', 'next', 'basic'],
      function (err) {
        if (err) {
          console.error('Error inserting Next.js quiz:', err);
          return;
        }
        const quizId = this.lastID;
        const questions = [
          { text: 'Which folder defines file-based routes?', a: 'routes', b: 'pages', c: 'app', d: 'src', correct: 'B' },
          { text: 'What runs on the server by default in App Router?', a: 'Client Components', b: 'Server Components', c: 'Both', d: 'Neither', correct: 'B' },
          { text: 'Which command creates a new Next app?', a: 'npx create-next-app', b: 'npm init next', c: 'next new', d: 'npx next-create', correct: 'A' },
        ];
        const stmt = db.prepare(
          `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        questions.forEach((q) => stmt.run(quizId, q.text, q.a, q.b, q.c, q.d, q.correct));
        stmt.finalize();
        console.log('Next.js quiz seeded.');
      }
    );

    // Advanced variants (empty quizzes for now)
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['JavaScript Advanced', 'Advanced JavaScript patterns and internals', 'javascript', 'advanced'],
      (err) => {
        if (err) console.error('Error inserting JavaScript Advanced quiz:', err);
        else console.log('JavaScript Advanced quiz created');
      }
    );
    
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['TypeScript Advanced', 'Advanced typing and utilities', 'typescript', 'advanced'],
      (err) => {
        if (err) console.error('Error inserting TypeScript Advanced quiz:', err);
        else console.log('TypeScript Advanced quiz created');
      }
    );
    
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['React Advanced', 'Concurrent features and performance', 'react', 'advanced'],
      (err) => {
        if (err) console.error('Error inserting React Advanced quiz:', err);
        else console.log('React Advanced quiz created');
      }
    );
    
    db.run(
      `INSERT INTO quizzes (title, description, category, level) VALUES (?, ?, ?, ?)`,
      ['Next.js Advanced', 'Routing, data fetching, and optimization', 'next', 'advanced'],
      (err) => {
        if (err) console.error('Error inserting Next.js Advanced quiz:', err);
        else console.log('Next.js Advanced quiz created');
        console.log('Database seeded successfully!');
      }
    );
  });
};

seedData();