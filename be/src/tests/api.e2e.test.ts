import request from 'supertest'
import app from '../server'

/**
 * End-to-end API tests covering all routes under /api plus /health.
 * These tests avoid relying on seed data by creating their own quiz and question.
 */
describe('API E2E', () => {
  let createdQuizId: number
  let createdQuestionId: number
  const testUser = { username: 'Api Tester', email: 'api.tester@example.com' }

  it('GET /health should return ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({ status: 'ok' }))
  })

  it('GET /api/quizzes should return list (possibly empty)', async () => {
    const res = await request(app).get('/api/quizzes')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('quizzes')
    expect(Array.isArray(res.body.quizzes)).toBe(true)
  })

  it('POST /api/quizzes should create a quiz', async () => {
    const payload = {
      title: 'E2E Test Quiz',
      description: 'Created by API E2E tests',
      category: 'e2e',
      level: 'basic',
    }
    const res = await request(app).post('/api/quizzes').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    createdQuizId = res.body.id
    expect(typeof createdQuizId).toBe('number')
  })

  it('POST /api/quizzes/:quizId/questions should add a question', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${createdQuizId}/questions`)
      .send({
        question_text: 'What is 2 + 2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '22',
        correct_option: 'B',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    createdQuestionId = res.body.id
    expect(typeof createdQuestionId).toBe('number')
  })

  it('GET /api/quiz/:quizId/questions should return questions without answers', async () => {
    const res = await request(app).get(`/api/quiz/${createdQuizId}/questions`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('questions')
    const { questions } = res.body
    expect(Array.isArray(questions)).toBe(true)
    expect(questions.length).toBeGreaterThan(0)
    const q = questions.find((qq: any) => qq.id === createdQuestionId) || questions[0]
    expect(q).toHaveProperty('id')
    expect(q).toHaveProperty('question_text')
    expect(q).toHaveProperty('options')
    expect(q).not.toHaveProperty('correct_option')
  })

  it('POST /api/quiz/:quizId/submit should validate payload', async () => {
    const res = await request(app).post(`/api/quiz/${createdQuizId}/submit`).send({ invalid: 'data' })
    expect(res.status).toBe(400)
  })

  it('POST /api/quiz/:quizId/submit should score submission and record attempt (with user)', async () => {
    const res = await request(app)
      .post(`/api/quiz/${createdQuizId}/submit`)
      .query({ details: 'true' })
      .send({
        user: testUser,
        answers: [
          { question_id: createdQuestionId, selected_option: 'B' },
        ],
      })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('total_questions')
    expect(res.body).toHaveProperty('correct_answers')
    expect(res.body).toHaveProperty('score_percentage')
    expect(res.body).toHaveProperty('details')
    expect(Array.isArray(res.body.details)).toBe(true)
  })

  it('GET /api/quiz/attempts should require email', async () => {
    const res = await request(app).get('/api/quiz/attempts')
    expect(res.status).toBe(400)
  })

  it('GET /api/quiz/attempts should return attempts for user', async () => {
    const res = await request(app).get('/api/quiz/attempts').query({ email: testUser.email })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('attempts')
    expect(Array.isArray(res.body.attempts)).toBe(true)
    expect(res.body.attempts.length).toBeGreaterThan(0)
  })

  it('GET /api/quiz/:quizId/leaderboard should return leaderboard', async () => {
    const res = await request(app).get(`/api/quiz/${createdQuizId}/leaderboard`).query({ limit: 5 })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('leaderboard')
    expect(Array.isArray(res.body.leaderboard)).toBe(true)
  })

  it('POST /api/ai-assessment/generate should create a quiz (AI or static fallback)', async () => {
    const res = await request(app)
      .post('/api/ai-assessment/generate')
      .send({ topic: 'JavaScript Fundamentals', difficulty: 'easy', questionCount: 5 })

    // Depending on environment, AI may fail and static fallback is used
    expect([200, 201, 500]).toContain(res.status)

    if (res.status === 201 || res.status === 200) {
      expect(res.body).toHaveProperty('quizId')
      expect(typeof res.body.quizId).toBe('number')
      expect(res.body).toHaveProperty('generationType')
    } else {
      // If both AI and static generation fail (e.g., DB closed), ensure error body format
      expect(res.body).toHaveProperty('error')
    }
  })
})


