import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import HomeDashboard from './components/HomeDashboard';
import CalendarPage from './components/CalendarPage';
import DayEditor from './components/DayEditor';
import MonthlyHisaab from './components/MonthlyHisaab';
import Settings from './components/Settings';

import { CalendarDays } from 'lucide-react';

export default function App() {
  const { init, setupComplete, loaded } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25 text-white">
            <CalendarDays size={28} />
          </div>
          <span className="font-bold text-sm text-text-muted">Loading Dailio...</span>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/hisaab" element={<MonthlyHisaab />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <DayEditor />
    </BrowserRouter>
  );
}
