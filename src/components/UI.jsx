import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Lock,
  Play,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

export function Logo({ to = '/' }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 font-bold text-lg"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500">
        <Sparkles size={18} />
      </span>

      <span>
        LearnPath <span className="text-indigo-400">AI</span>
      </span>
    </Link>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...p
}) {
  return (
    <button
      className={`${
        variant === 'primary' ? 'btn-primary' : 'btn-secondary'
      } ${className}`}
      {...p}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-indigo-400 transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
        }}
      />
    </div>
  );
}

export function SkillBar({ name, value }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{name}</span>
        <span className="muted">{value}%</span>
      </div>

      <ProgressBar value={value} />
    </div>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const c = {
    slate: 'bg-white/5 text-slate-300',
    indigo: 'bg-indigo-500/15 text-indigo-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    red: 'bg-rose-500/15 text-rose-300',
  }[tone] || 'bg-white/5 text-slate-300';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${c}`}
    >
      {children}
    </span>
  );
}

export function RoadmapNode({ phase, onClick }) {
  const done = phase.status === 'completed';
  const current = phase.status === 'current';
  const locked = phase.status === 'locked';

  return (
    <button
      onClick={() => onClick?.(phase)}
      className="group flex w-full gap-4 text-left"
    >
      <div className="flex w-10 flex-col items-center">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
            done
              ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
              : current
                ? 'border-indigo-400/50 bg-indigo-500 text-white'
                : 'border-white/10 bg-white/5 text-slate-500'
          }`}
        >
          {done ? (
            <Check size={18} />
          ) : locked ? (
            <Lock size={16} />
          ) : (
            <Circle size={14} />
          )}
        </span>

        <span className="mt-2 h-full w-px bg-white/10 group-last:hidden" />
      </div>

      <div className="card mb-4 flex-1 p-4 transition group-hover:border-indigo-400/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">{phase.title}</div>

            <div className="mt-1 text-sm muted">
              {phase.skills.join(' • ')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              tone={
                done
                  ? 'green'
                  : current
                    ? 'indigo'
                    : locked
                      ? 'slate'
                      : 'amber'
              }
            >
              {done
                ? 'Completed'
                : current
                  ? 'In Progress'
                  : locked
                    ? 'Locked'
                    : 'Available'}
            </Badge>

            <ChevronRight size={16} className="muted" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function FeedbackButtons({ onFeedback }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => onFeedback('easy')}
      >
        <ThumbsUp size={15} />
        Too Easy
      </Button>

      <Button
        variant="secondary"
        onClick={() => onFeedback('hard')}
      >
        <ThumbsDown size={15} />
        Too Difficult
      </Button>

      <Button
        variant="secondary"
        onClick={() => onFeedback('complete')}
      >
        <Check size={15} />
        Completed
      </Button>
    </div>
  );
}

export const Arrow = ({ children }) => (
  <span className="inline-flex items-center gap-2">
    {children}
    <ArrowRight size={16} />
  </span>
);

export const Time = ({ children }) => (
  <span className="inline-flex items-center gap-1 text-xs muted">
    <Clock3 size={13} />
    {children}
  </span>
);

export const PlayIcon = () => (
  <Play size={15} fill="currentColor" />
);

export function SkillGapRadar({ gaps = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {gaps.map((g) => (
        <div
          key={g.skill}
          className="rounded-xl border border-white/10 bg-white/[.03] p-4"
        >
          <div className="flex justify-between text-sm">
            <b>{g.skill}</b>

            <span
              className={
                g.importance === 'High'
                  ? 'text-rose-300'
                  : 'text-amber-300'
              }
            >
              {g.importance}
            </span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-400"
              style={{
                width: `${Math.min(g.current, 100)}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs muted">
            <span>Current {g.current}%</span>
            <span>Required {g.required}%</span>
          </div>

          <div className="mt-1 text-xs muted">
            Gap {Math.max(g.required - g.current, 0)} pts
          </div>
        </div>
      ))}
    </div>
  );
}