import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Clock, Target, Sparkles, Zap, Send, Loader2, Search, CheckCircle2, Database, ArrowRight } from 'lucide-react';
import { AIPageShell } from '@/components/Dashboard/Sidebar/AISidebar';

interface AssessmentConfig {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

export const AIAssessmentPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AssessmentConfig>({
    topic: '',
    difficulty: 'medium',
    questionCount: 10
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [countdown, setCountdown] = useState(30);
  const [messageIndex, setMessageIndex] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_URL
  const topics = [
    'JavaScript Fundamentals',
    'React Development',
    'TypeScript',
    'Node.js',
    'Python Programming',
    'Machine Learning',
    'Data Science',
    'Web Development',
    'Mobile Development',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity',
    'Database Design',
    'System Design',
    'UI/UX Design',
    'Blockchain',
    'Artificial Intelligence',
    'Data Structures',
    'Algorithms',
    'Software Engineering'
  ];

  const difficultyLevels = [
    { 
      value: 'easy', 
      label: 'Easy', 
      description: 'Basic concepts and fundamentals',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      description: 'Intermediate knowledge required',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    { 
      value: 'hard', 
      label: 'Hard', 
      description: 'Advanced concepts and problem-solving',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  ];

  const questionCounts = [5, 10, 15, 20, 25, 30];

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!config.topic.trim()) {
      newErrors.topic = 'Please select or enter a topic';
    }

    if (config.questionCount < 5 || config.questionCount > 50) {
      newErrors.questionCount = 'Question count must be between 5 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateQuiz = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setErrors({}); // Clear previous errors
    setCountdown(30);
    setMessageIndex(0);
    
    const requestData = {
      topic: config.topic,
      difficulty: config.difficulty,
      questionCount: config.questionCount
    };
    
    console.log('🚀 Starting quiz generation...');
    console.log('📊 Request data:', requestData);
    console.log('🔗 API URL: {API}/api/ai-assessment/generate');
    
    try {
      // Call API to generate quiz
      const response = await fetch(`${API_BASE_URL}/ai-assessment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      // Navigate to the quiz page with the generated quiz ID
      console.log('🔄 Navigating to quiz:', data.quizId);
      navigate(`/quiz/${data.quizId}`);
    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ general: 'Cannot connect to server. Please make sure the backend is running on port 3001.' });
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Progress messages shown in the processing dialog
  const progressSteps: { label: string; icon: ReactNode }[] = [
    { label: 'Processing Request ...', icon: <Loader2 className="w-5 h-5 animate-spin text-primary" /> },
    { label: 'Sending to Nebula AI ...', icon: <Send className="w-5 h-5 text-blue-500" /> },
    { label: 'Gathering information on Topic ...', icon: <Search className="w-5 h-5 text-emerald-500" /> },
    { label: 'Generating the questions ...', icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
    { label: 'Questions Generated .....', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
    { label: 'Storing to the db ....', icon: <Database className="w-5 h-5 text-amber-500" /> },
    { label: 'Redirecting to the quiz ...', icon: <ArrowRight className="w-5 h-5 text-pink-500" /> },
  ];

  // Drive the 20s countdown and 3s step progression while generating
  useEffect(() => {
    if (!isGenerating) return;

    setCountdown(30);
    setMessageIndex(0);

    const oneSecond = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    const threeSeconds = setInterval(() => {
      setMessageIndex((i) => (i < progressSteps.length - 1 ? i + 1 : i));
    }, 5000);

    return () => {
      clearInterval(oneSecond);
      clearInterval(threeSeconds);
    };
  }, [isGenerating]);

  return (
    <AIPageShell title="AI Assessment">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-0">
          {/* <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                AI Assessment
              </span>
            </div>
          </div> */}
         
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          {/* Configuration Panel */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 lg:p-8 ai-card-glow ai-glass">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-6 h-6 sm:w-8 sm:h-8 ai-button-gradient rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold ai-text-gradient">Create Your AI Assessment</h2>
              </div>

              {/* Topic Selection */}
              <div className="space-y-4 mb-8">
                <label className="block text-base font-medium">
                  What topic would you like to be assessed on?
                </label>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Type your topic or choose from suggestions below"
                    value={config.topic}
                    onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                    className={`w-full px-4 py-4 text-lg border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.topic ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {topics.slice(0, 12).map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setConfig({ ...config, topic })}
                        className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ai-rounded-lg border transition-colors hover:bg-primary hover:text-primary-foreground ${
                          config.topic === topic
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:border-primary'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  {errors.topic && (
                    <p className="text-sm text-red-500">{errors.topic}</p>
                  )}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-4 mb-8">
                <label className="block text-base font-medium">
                  Choose difficulty level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {difficultyLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setConfig({ ...config, difficulty: level.value as 'easy' | 'medium' | 'hard' })}
                      className={`p-4 sm:p-6 text-center border ai-rounded-xl transition-all hover:scale-105 ${
                        config.difficulty === level.value
                          ? `${level.bgColor} ${level.borderColor} ${level.color}`
                          : 'bg-card border-input hover:border-primary'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="font-semibold text-sm sm:text-lg">{level.label}</span>
                        <p className="text-xs opacity-80">{level.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="space-y-4 mb-8">
                <label className="block text-base font-medium">
                  How many questions?
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                    {questionCounts.map((count) => (
                      <button
                        key={count}
                        onClick={() => setConfig({ ...config, questionCount: count })}
                        className={`px-3 sm:px-4 py-2 sm:py-3 ai-rounded-lg border transition-colors text-center ${
                          config.questionCount === count
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:border-primary hover:bg-primary/10'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Custom:</span>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={config.questionCount}
                      onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) || 10 })}
                      className="w-24 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">(5-50)</span>
                  </div>
                  {errors.questionCount && (
                    <p className="text-sm text-red-500">{errors.questionCount}</p>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="space-y-4">
                {errors.general && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-destructive text-sm">{errors.general}</p>
                  </div>
                )}
                
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating}
                  className={`w-full py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                    isGenerating
                      ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed'
                      : 'ai-button-gradient hover:shadow-xl'
                  }`}
                  size="lg"
                >
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Generating — kindly wait… do not close</span>
                      </div>
                      <span className="text-xs opacity-90">Time remaining: {countdown}s</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5" />
                      <span>Generate AI Assessment</span>
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <Card className="p-6 ai-card-glow ai-glass">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Summary</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Topic:</span>
                  <span className="font-medium text-right max-w-32 truncate" title={config.topic}>
                    {config.topic || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Level:</span>
                  <span className={`font-medium capitalize ${
                    difficultyLevels.find(l => l.value === config.difficulty)?.color || ''
                  }`}>
                    {config.difficulty}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{config.questionCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">~{Math.ceil(config.questionCount * 1.5)} min</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {/* Full-screen blocking overlay while generating */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop that blurs and blocks clicks */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"></div>

          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md mx-4 ai-glass ai-card-glow border border-border rounded-2xl p-6 bg-card/90 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Processing your AI assessment</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Estimated time</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin"></div>
                <span>{countdown}s</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-start gap-3">
                {progressSteps[messageIndex]?.icon}
                <div className="flex-1">
                  <p className="font-medium">
                    {progressSteps[messageIndex]?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Please keep this tab open while we prepare your quiz.</p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((messageIndex + 1) / progressSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AIPageShell>
  );
};
