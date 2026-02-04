import { QuizPage } from '@/components/Dashboard/Assesment/QuizPage';
import { ResultsPage } from '@/components/Dashboard/Assesment/ResultsPage';
import { HistoryPage } from '@/components/Dashboard/History/HistoryPage';
import { LeaderboardPage } from '@/components/Dashboard/LeaderBoard/LeaderboardPage';
import { AdminCreateQuiz } from '@/components/Dashboard/CreateQuiz/AdminCreateQuiz';
import { HomePage } from '@/components/LandingPage/HomePage';
import { DashboardPage } from '@/components/Dashboard/DashboardPage';
import { AIAssessmentPage } from '@/components/Dashboard/Assesment/AIAssessmentPage';
import React from 'react';
import { Routes, Route } from 'react-router-dom';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* add routers according to my components */}
      <Route path="/" element={<HomePage/>} />
      <Route path="/home" element={<HomePage/>} />
      <Route path="/dashboard" element={<DashboardPage/>} />
      <Route path="/ai-assessment" element={<AIAssessmentPage/>} />
      <Route path="/quiz/:id" element={<QuizPage />} />
      <Route path="/results" element={<ResultsPage/>} />
      <Route path="/history" element={<HistoryPage/>} />
      <Route path="/leaderboard" element={<LeaderboardPage/>} />
      <Route path="/leaderboard/:id" element={<LeaderboardPage/>} />
      <Route path="/admin/create" element={<AdminCreateQuiz/>} />
    </Routes>
  );
};

export default AppRoutes; 