// SQLite setup and bootstrapping
import sqlite3 from 'sqlite3';
import path from 'path';

// Pick DB file from env or use a sensible default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../quiz.db');

/**
 * Shared SQLite connection. We kick off schema setup on connect.
 */
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

/**
 * Create tables if they're missing.
 */
function initializeDatabase() {
  db.serialize(() => {
    // Quizzes table
    db.run(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Best-effort migration for existing databases
    db.run(`ALTER TABLE quizzes ADD COLUMN category TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding category column:', err);
      }
    });
    db.run(`ALTER TABLE quizzes ADD COLUMN level TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding level column:', err);
      }
    });

    // Questions table
    db.run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
        explanation TEXT,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
      )
    `);

    // Add explanation column to existing questions table
    db.run(`ALTER TABLE questions ADD COLUMN explanation TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding explanation column:', err);
      }
    });

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attempts table
    db.run(`
      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score_percentage INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
      )
    `);
  });
}

/**
 * Close the DB connection politely.
 */
export const closeDatabase = () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
};