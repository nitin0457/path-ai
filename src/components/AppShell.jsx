import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  Brain,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Mic2,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react';

import { Logo } from './UI';

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/roadmap', 'Learning Roadmap', Map],
  ['/assessment', 'Skill Assessment', Brain],
  ['/projects', 'Project Lab', WandSparkles],
  ['/assistant', 'AI Assistant', Bot],
  ['/review', 'AI Review', BarChart3],
  ['/interview', 'Interview Mode', Mic2],
  ['/profile', 'Profile', UserRound],
];

export default function AppShell({
  children,
  learner,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#0a0f1d] p-5 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo to="/dashboard" />

          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#070b16]/85 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>

          <div className="lg:hidden">
            <Logo to="/dashboard" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">
                {learner?.name || 'Learner'}
              </div>

              <div className="text-xs muted">
                {learner?.careerGoal || 'Personalized learning'}
              </div>
            </div>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500 font-bold">
              {(learner?.name || 'L')[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}