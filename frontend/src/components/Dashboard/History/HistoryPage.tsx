import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '@/services/api/api.service';
import { type AttemptRecord } from '@/types/quiz.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIPageShell } from '@/components/Dashboard/Sidebar/AISidebar';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('quiz_user');
    const user = stored ? JSON.parse(stored) as { email: string; username?: string } : null;
    if (user?.email) {
      setEmail(user.email);
      setUsername(user.username || '');
      quizApi.getAttempts(user.email)
        .then(setAttempts)
        .catch(() => setError('Failed to load history.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const groupedByQuiz = useMemo(() => {
    const map = new Map<number, AttemptRecord[]>();
    for (const a of attempts) {
      if (!map.has(a.quiz_id)) map.set(a.quiz_id, []);
      map.get(a.quiz_id)!.push(a);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a - b);
  }, [attempts]);

  if (loading) {
    return (
      <AIPageShell title="History">
        <div className="max-w-3xl space-y-4">
          <div className="ai-skeleton ai-skeleton-title w-56"></div>
          <div className="bg-card border ai-rounded-xl p-4 ai-card-glow">
            <div className="ai-skeleton ai-skeleton-text w-2/3"></div>
            <div className="ai-skeleton ai-skeleton-text w-full"></div>
            <div className="ai-skeleton ai-skeleton-text w-5/6"></div>
          </div>
        </div>
      </AIPageShell>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => navigate('/start')}>Go to Start</Button>
        </div>
      </div>
    );
  }

  return (
    <AIPageShell title="Your Quiz History">
      <div className="max-w-5xl space-y-6">
        <Card className="ai-card-glow ai-rounded-xl ai-glass">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Your Quiz History</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  className="w-full sm:w-64 px-3 py-2 border ai-rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mobile-input"
                  placeholder="Enter email to view history"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!email.trim()) {
                      setError('Please enter an email');
                      return;
                    }
                    setError(null);
                    setLoading(true);
                    quizApi.getAttempts(email.trim())
                      .then(setAttempts)
                      .catch(() => setError('Failed to load history.'))
                      .finally(() => setLoading(false));
                  }}
                  className="mobile-button-full sm:w-auto"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!email && (
              <p className="text-muted-foreground">Enter your email above to view your history.</p>
            )}
            {email && attempts.length === 0 && (
              <p className="text-muted-foreground">No attempts yet for {email}.</p>
            )}
            {email && attempts.length > 0 && (
              <div className="space-y-6">
                {groupedByQuiz.map(([quizId, items]) => (
                  <div key={quizId}>
                    <h3 className="font-semibold mb-2">Quiz #{quizId}</h3>
                    <div className="space-y-2">
                      {items.map((a) => (
                        <div key={a.id} className="flex justify-between items-center bg-card ai-rounded-md border p-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{a.score_percentage}%</p>
                            <p className="text-sm text-muted-foreground">{a.correct_answers}/{a.total_questions} correct</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {username && email ? (<span>Signed in as <span className="font-medium">{username}</span> ({email})</span>) : null}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate('/home')} className="mobile-button-full sm:w-auto">Home</Button>
            <Button onClick={() => navigate('/dashboard')} className="mobile-button-full sm:w-auto">Go to Dashboard</Button>
          </div>
        </div>
      </div>
    </AIPageShell>
  );
};


