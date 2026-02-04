import { useState } from 'react';
import { quizApi } from '@/services/api/api.service';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/Theme/theme-toggle';
import { AIPageShell } from '@/components/Dashboard/Sidebar/AISidebar';

export const AdminCreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('javascript');
  const [level, setLevel] = useState('basic');
  const [msg, setMsg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [question, setQuestion] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' as 'A'|'B'|'C'|'D'
  });

  const [questionList, setQuestionList] = useState<typeof question[]>([]);

  const createQuiz = async () => {
    if (!title.trim()) { setMsg('Please provide a title'); return; }
    try {
      setIsCreating(true);
      setMsg('Creating quiz...');
      const res = await quizApi.createQuiz({ title, description, category, level });
      setMsg('Quiz created. Adding questions...');
      for (const q of questionList) {
        await quizApi.addQuestion(res.id, q);
      }
      setMsg('Stored successfully! Access the quiz from the dashboard.');
    } catch (error) {
      setMsg('Failed to store quiz. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const addQuestion = async () => {
    setQuestionList(prev => [...prev, question]);
    setMsg('Question staged');
    setQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
  };

  return (
    <AIPageShell title="Create Quiz">
      <div className="max-w-5xl space-y-4 sm:space-y-6">
        <div className="flex justify-end items-center">
          <ThemeToggle />
        </div>
        {msg && (
          <div className="text-sm px-3 py-2 ai-rounded-md border bg-card ai-glass">
            {msg}
          </div>
        )}
        <div className="grid gap-3 ai-card-glow ai-rounded-xl p-3 sm:p-4 border bg-card ai-glass">
          <input className="mobile-input border border-input ai-rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <input className="mobile-input border border-input ai-rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="mobile-input border border-input ai-rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="react">React</option>
              <option value="next">Next</option>
            </select>
            <select className="mobile-input border border-input ai-rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={level} onChange={(e)=>setLevel(e.target.value)}>
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          {questionList.length > 0 && (
            <div className="text-sm text-muted-foreground">Staged questions: {questionList.length}</div>
          )}
        </div>

        <div className="border-t pt-6 space-y-3 ai-card-glow ai-rounded-xl p-4 border bg-card ai-glass">
          <h2 className="font-semibold">Add Question</h2>
          <input className="border ai-rounded-md px-3 py-2" placeholder="Question text" value={question.question_text} onChange={(e)=>setQuestion({...question, question_text: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="border ai-rounded-md px-3 py-2" placeholder="Option A" value={question.option_a} onChange={(e)=>setQuestion({...question, option_a: e.target.value})} />
            <input className="border ai-rounded-md px-3 py-2" placeholder="Option B" value={question.option_b} onChange={(e)=>setQuestion({...question, option_b: e.target.value})} />
            <input className="border ai-rounded-md px-3 py-2" placeholder="Option C" value={question.option_c} onChange={(e)=>setQuestion({...question, option_c: e.target.value})} />
            <input className="border ai-rounded-md px-3 py-2" placeholder="Option D" value={question.option_d} onChange={(e)=>setQuestion({...question, option_d: e.target.value})} />
          </div>
          <select className="border ai-rounded-md px-3 py-2" value={question.correct_option} onChange={(e)=>setQuestion({...question, correct_option: e.target.value as any})}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
          <div className="flex gap-3">
            <Button onClick={addQuestion}>Add Question</Button>
            <Button variant="outline" onClick={()=>setQuestionList([])}>Clear Staged</Button>
          </div>
        </div>

        {/* Finalize create only after questions are staged */}
        <div className="pt-2">
          <Button
            disabled={questionList.length === 0 || isCreating}
            onClick={createQuiz}
            className={`${isCreating ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed text-white' : ''}`}
          >
            {questionList.length === 0 ? (
              'Add questions to enable Create'
            ) : isCreating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating — kindly wait… do not close
              </span>
            ) : (
              'Create Quiz with Questions'
            )}
          </Button>
        </div>
      </div>
    </AIPageShell>
  );
};


