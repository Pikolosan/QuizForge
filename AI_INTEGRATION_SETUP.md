# AI Integration Setup Guide

## 🤖 Gemini AI Integration for Quiz Generation

This guide will help you set up the Gemini AI integration for automatic quiz generation.

## 📋 Prerequisites

1. **Gemini API Key**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Node.js**: Ensure you have Node.js installed
3. **Dependencies**: All required packages are already installed

## 🚀 Quick Setup

### 1. Environment Configuration

Create a `.env` file in the `be` directory:

```bash
cd be
cp env.example .env
```

Edit the `.env` file and add your Gemini API key:

```env
# Gemini AI API Key - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Database configuration
DB_PATH=./quiz.db

# Server configuration
PORT=3001
```

### 2. Start the Backend

```bash
cd be
npm start
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

## 🎯 How It Works

### AI-Powered Quiz Generation

1. **User Input**: Users specify topic, difficulty, and number of questions
2. **AI Processing**: Gemini AI generates contextual MCQs with explanations
3. **Validation**: Zod schemas ensure proper response structure
4. **Fallback**: Static questions if AI generation fails

### Features

- ✅ **Dynamic Question Generation**: Real-time AI-powered quiz creation
- ✅ **Structured Validation**: Zod schemas ensure data integrity
- ✅ **Detailed Explanations**: AI provides reasoning for correct answers
- ✅ **Fallback System**: Static questions when AI is unavailable
- ✅ **Error Handling**: Robust error management and user feedback
- ✅ **Flexible Topics**: Support for any topic at any difficulty level

## 🔧 Technical Architecture

### Backend Components

```
be/src/
├── schemas/
│   └── aiQuizSchema.ts      # Zod validation schemas
├── services/
│   ├── geminiService.ts     # AI service integration
│   └── quizservice.ts       # Enhanced with AI methods
└── controllers/
    └── quizcontroller.ts    # AI endpoint handling
```

### Key Files

1. **`aiQuizSchema.ts`**: Defines TypeScript types and Zod validation
2. **`geminiService.ts`**: Handles Gemini AI communication
3. **`quizservice.ts`**: Database operations for AI-generated quizzes
4. **`quizcontroller.ts`**: API endpoints with fallback logic

### Database Schema

The questions table now includes an `explanation` field:

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,  -- New field for AI explanations
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
```

## 🎨 Frontend Integration

### AI Assessment Page

Located at `/ai-assessment`, this page provides:

- Clean, spacious UI design
- Topic selection with suggestions
- Difficulty level cards
- Question count customization
- Real-time form validation
- Loading states and animations

### Enhanced Results Display

The results page now shows:

- Color-coded correct/incorrect answers
- AI-generated explanations for each question
- Improved visual hierarchy
- Better user experience

## 🔀 API Endpoints

### Generate AI Quiz

```http
POST /api/ai-assessment/generate
Content-Type: application/json

{
  "topic": "React Development",
  "difficulty": "medium",
  "questionCount": 10
}
```

**Response:**
```json
{
  "quizId": 123,
  "message": "Quiz generated successfully using ai generation",
  "generationType": "ai"
}
```

### Error Handling

The system provides graceful fallbacks:

1. **AI Generation**: First attempts Gemini AI
2. **Static Fallback**: Uses pre-built questions if AI fails
3. **User Feedback**: Clear error messages with retry options

## 🛠 Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify your Gemini API key is correct
   - Check API key permissions and quotas

2. **Rate Limiting**
   - Gemini has usage limits on free tier
   - System automatically falls back to static questions

3. **Network Issues**
   - Check internet connectivity
   - Verify API endpoint accessibility

### Debug Mode

Enable detailed logging by checking server console:

```bash
# Backend logs show:
# - AI generation attempts
# - Validation results
# - Fallback triggers
# - Database operations
```

## 📊 Usage Analytics

The system tracks:

- AI vs Static generation usage
- Success/failure rates
- Topic popularity
- Difficulty distribution

## 🚀 Future Enhancements

Planned improvements:

1. **Multiple AI Providers**: Support for other AI services
2. **Question Caching**: Store popular AI-generated questions
3. **Adaptive Difficulty**: AI adjusts based on user performance
4. **Bulk Generation**: Create multiple quizzes simultaneously
5. **Custom Prompts**: User-defined AI generation parameters

## 🔒 Security & Privacy

- API keys are stored in environment variables
- User data is not sent to AI services
- Generated content is validated before storage
- No personal information in AI prompts

## 📞 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your API key and network connectivity
3. Try the static fallback option
4. Review this documentation for common solutions

---

**Ready to use AI-powered quiz generation!** 🎉

The system is now capable of generating dynamic, contextual quizzes on any topic with intelligent explanations, while maintaining reliability through smart fallback mechanisms.
