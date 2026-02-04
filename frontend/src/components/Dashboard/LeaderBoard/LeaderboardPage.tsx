import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizApi } from '@/services/api/api.service';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/Theme/theme-toggle';
import { AIPageShell } from '@/components/Dashboard/Sidebar/AISidebar';

export const LeaderboardPage = () => {
  const { id } = useParams();
  const quizId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const [rows, setRows] = useState<Array<{ rank: number; username: string; email: string; score_percentage: number; correct_answers: number; total_questions: number; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      return;
    }
    quizApi.getLeaderboard(quizId)
      .then(setRows)
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return (
    <AIPageShell title="Leaderboard">
      <div className="max-w-5xl space-y-4">
        <div className="ai-skeleton ai-skeleton-title w-48"></div>
        <div className="bg-card border ai-rounded-xl p-4 ai-card-glow">
          <div className="ai-skeleton ai-skeleton-text w-full mb-2"></div>
          <div className="ai-skeleton ai-skeleton-text w-5/6 mb-2"></div>
          <div className="ai-skeleton ai-skeleton-text w-2/3"></div>
        </div>
      </div>
    </AIPageShell>
  );
  if (!quizId) return (
    <AIPageShell title="Leaderboard">
      <div className="max-w-5xl space-y-4">
        <div className="bg-card border ai-rounded-xl ai-card-glow ai-glass p-6 text-center">
          <div className="text-lg font-semibold mb-2">Select a quiz to view its leaderboard</div>
          <div className="text-sm text-muted-foreground">You can open a quiz and then click Leaderboard from its page.</div>
        </div>
      </div>
    </AIPageShell>
  );
  if (error) return (
    <AIPageShell title="Leaderboard">
      <div className="text-destructive">{error}</div>
    </AIPageShell>
  );

  return (
    <AIPageShell title="Leaderboard">
      <div className="max-w-5xl space-y-4">
        <div className="flex justify-end"><ThemeToggle /></div>
        <div className="bg-card border ai-rounded-xl ai-card-glow ai-glass overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-6 px-4 py-2 text-sm font-semibold border-b">
              <div>Rank</div>
              <div className="col-span-2">User</div>
              <div>Score</div>
              <div>Correct</div>
              <div>Date</div>
            </div>
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">No leaderboard data yet.</div>
            ) : rows.map(r => (
              <div key={`${r.email}-${r.created_at}`} className="grid grid-cols-6 px-4 py-2 border-b last:border-b-0">
                <div>#{r.rank}</div>
                <div className="col-span-2">{r.username} <span className="text-xs text-muted-foreground">({r.email})</span></div>
                <div className="font-semibold">{r.score_percentage}%</div>
                <div>{r.correct_answers}/{r.total_questions}</div>
                <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          {/* Mobile Cards */}
          <div className="sm:hidden">
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">No leaderboard data yet.</div>
            ) : rows.map(r => (
              <div key={`${r.email}-${r.created_at}`} className="p-4 border-b last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-lg">#{r.rank}</div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">{r.score_percentage}%</div>
                    <div className="text-sm text-muted-foreground">{r.correct_answers}/{r.total_questions}</div>
                  </div>
                </div>
                <div className="text-sm font-medium">{r.username}</div>
                <div className="text-xs text-muted-foreground mb-1">{r.email}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    </AIPageShell>
  );
}


