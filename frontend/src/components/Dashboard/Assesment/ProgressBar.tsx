import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full space-y-2">
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground text-center">
        {current + 1} / {total} questions
      </p>
    </div>
  );
};

