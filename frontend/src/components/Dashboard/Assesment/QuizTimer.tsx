import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TimerProps {
  minutes: number;
  seconds: number;
  isWarning?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ minutes, seconds, isWarning = false }) => {
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  return (
    <Card className={`px-4 py-2 ${isWarning ? 'bg-destructive text-destructive-foreground' : ''}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        <span className="text-lg font-mono font-semibold">{formattedTime}</span>
      </div>
    </Card>
  );
};

