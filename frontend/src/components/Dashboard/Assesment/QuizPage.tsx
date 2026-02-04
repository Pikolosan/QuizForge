import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/Dashboard/Assesment/QuestionsCards'; 
import { Timer } from '@/components/Dashboard/Assesment/QuizTimer';
import { ProgressBar } from '@/components/Dashboard/Assesment/ProgressBar';
import { useTimer } from '@/hooks/useTimer';
import { quizApi } from '@/services/api/api.service'
import { type Question, type Answer, type UserInfo } from '@/types/quiz.types';
import { ChevronLeft, ChevronRight, Send, Loader2, BookOpen, Trophy, Home, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/Theme/theme-toggle';

export const QuizPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const quizId = Number(params.id || 1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, 'A' | 'B' | 'C' | 'D'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { minutes, seconds, timeLeft, start } = useTimer(10);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await quizApi.getQuestions(quizId);
        setQuestions(data);
        setLoading(false);
        start();
        // request fullscreen
        const el = document.documentElement as any;
        if (el && el.requestFullscreen) {
          try { await el.requestFullscreen(); } catch {}
        }
        // visibility change warning
        const onVisibility = () => {
          if (document.hidden) {
            alert('Please stay on the quiz. Minimizing or switching may end your attempt.');
            navigate('/');
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
      } catch (err) {
        setError('Failed to load questions. Please try again.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId, navigate]); // REMOVED 'start' from dependencies

  const handleSubmit = useCallback(async () => {
    if (submitting) return; // Prevent double submission
    
    setSubmitting(true);
    try {
      const submissionAnswers: Answer[] = Array.from(answers.entries()).map(
        ([question_id, selected_option]) => ({
          question_id,
          selected_option,
        })
      );

      const stored = sessionStorage.getItem('quiz_user');
      const user: UserInfo | undefined = stored ? JSON.parse(stored) : undefined;
      const result = await quizApi.submitQuiz(quizId, submissionAnswers, true, user);
      navigate('/results', { state: { result, quizId } });
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  }, [answers, quizId, navigate, submitting]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitting) {
      handleSubmit();
    }
  }, [timeLeft, questions.length, handleSubmit, submitting]);

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(new Map(answers.set(questions[currentIndex].id, option)));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="mb-4">No questions found for this quiz yet. Please add questions and try again.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            <Button onClick={() => navigate('/admin/create')}>Create Questions</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = answers.size;
  const isWarning = timeLeft < 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-6 border-b border-border/50 bg-card/50 backdrop-blur-sm gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Quiz Challenge</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Timer minutes={minutes} seconds={seconds} isWarning={isWarning} />
            <Button variant="ghost" size="sm" onClick={() => navigate(`/leaderboard/${quizId}`)} className="hidden sm:flex">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/leaderboard/${quizId}`)} className="sm:hidden">
              <Trophy className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 lg:p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <ProgressBar current={currentIndex} total={questions.length} />
        </div>

        {/* Warning for low time */}
        {isWarning && (
          <div className="mx-4 lg:mx-6 mb-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Less than 1 minute remaining!
              </span>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="px-4 lg:px-6 pb-6">
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            selectedOption={answers.get(currentQuestion.id)}
            onSelectOption={handleSelectOption}
          />
        </div>

        {/* Navigation */}
        <div className="border-t p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground flex-1 sm:flex-none"
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Quiz</span>
              </Button>
            </div>

            <div className="w-full sm:w-auto">
              {isLastQuestion ? (
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 mobile-button-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Quiz
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} size="lg" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 mobile-button-full">
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};