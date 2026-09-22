import type { ReactNode } from 'react';
import { Home, Calendar, Calculator, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/hisaab', icon: Calculator, label: 'Hisaab' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-1 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
        <div className="mx-auto max-w-lg px-4 pb-2">
          <div className="flex items-center justify-around bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border/50 h-16 px-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] rounded-xl transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary-50'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
