// ==================== src/pages/ResultsPage.tsx ====================
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type QuizResult } from '@/types/quiz.types';
import { Trophy, CheckCircle2, XCircle, Home } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/Theme/theme-toggle';

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as QuizResult;
  const quizId = location.state?.quizId as number | undefined;

  if (!result) {
    navigate('/');
    return null;
  }

  const scoreColor = 
    result.score_percentage >= 80 ? 'text-green-600 dark:text-green-400' :
    result.score_percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-red-600 dark:text-red-400';

  const getMessage = () => {
    if (result.score_percentage >= 80) return 'Excellent Work! 🎉';
    if (result.score_percentage >= 60) return 'Good Job! 👍';
    return 'Keep Practicing! 💪';
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex justify-end mb-3 sm:mb-4">
          <ThemeToggle />
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trophy className={`w-16 h-16 ${scoreColor}`} />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">{getMessage()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <div>
                <p className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 ${scoreColor}`}>
                  {result.score_percentage}%
                </p>
                <Progress value={result.score_percentage} className="h-2 sm:h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto mt-4 sm:mt-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {result.correct_answers}
                  </p>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">Correct</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                    {result.total_questions - result.correct_answers}
                  </p>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">Incorrect</p>
                </div>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Review Your Answers</h3>
                {result.details.map((detail, index) => (
                  <Card key={detail.question_id} className={detail.is_correct ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {detail.is_correct ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        )}
                        <CardTitle className="text-lg font-semibold">
                          Question {index + 1}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{detail.question_text}</p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Your Answer:</span>{' '}
                        <span className={detail.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {detail.user_answer}
                        </span>
                      </p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Correct Answer:</span>{' '}
                        <span className="text-green-600 dark:text-green-400">
                          {detail.correct_answer}
                        </span>
                      </p>
                      {detail.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold text-blue-700 dark:text-blue-300">Explanation:</span>{' '}
                            <span className="text-blue-600 dark:text-blue-400">{detail.explanation}</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => navigate('/')} className="mobile-button-full sm:w-auto"> 
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          {quizId && (
            <Button onClick={() => navigate(`/leaderboard/${quizId}`)} className="mobile-button-full sm:w-auto">
              View Leaderboard
            </Button>
          )}
          <Button onClick={() => navigate('/history')} className="mobile-button-full sm:w-auto">
            View History
          </Button>
        </div>
      </div>
    </div>
  );
};