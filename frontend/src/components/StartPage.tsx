import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';

export const StartPage = () => {
  const navigate = useNavigate();

  // Removed prefetch of quizzes to avoid unused vars during redirect

  // Redirect to home page for better user flow
  useEffect(() => {
    navigate('/home');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground">Redirecting to Nebula...</p>
      </div>
    </div>
  );
};

