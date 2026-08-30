import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { api } from '../lib/api';

import {
  Badge,
  Button,
  FeedbackButtons,
  ProgressBar,
  SkillBar,
  Time,
  SkillGapRadar,
} from '../components/UI';

export default function Dashboard({
  learner,
  path,
  setPath,
}) {
  const [rec, setRec] = useState();
  const [insight, setInsight] = useState();
  const [week, setWeek] = useState();
  const [notice, setNotice] = useState('');

  const phases = path?.phases || [];
  const gaps = path?.skillGaps || [];

  const current =
    phases.find((p) => p.status === 'current') ||
    phases.find((p) => !p.completed);

  const progress = path?.progress || 0;

  useEffect(() => {
    (async () => {
      try {
        const [a, i, w] = await Promise.all([
          api.nextAction(),
          api.progressInsight(),
          api.weeklyPlan(),
        ]);

        setRec(a);
        setInsight(i);
        setWeek(w);
      } catch (e) {
        setNotice(e.message);
      }
    })();
  }, [path?._id]);

  const complete = async () => {
    if (!current) return;

    try {
      setPath(
        await api.updateProgress({
          phaseId: current.id,
          completed: true,
        })
      );

      setRec(await api.nextAction());

      setNotice(
        'Progress updated — AI recalculated your next best action.'
      );
    } catch (e) {
      setNotice(e.message);
    }
  };

  const feedback = async (type) => {
    try {
      await api.feedback({
        recommendationId: rec?.title || 'next-action',
        type,
      });

      setNotice(
        type === 'easy'
          ? 'Difficulty will increase.'
          : type === 'hard'
            ? 'AI will add prerequisite/revision support.'
            : 'Feedback saved.'
      );
    } catch (e) {
      setNotice(e.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-7">
        <div className="text-sm text-indigo-300">
          Personalized learning dashboard
        </div>

        <h1 className="mt-1 text-3xl font-bold">
          Good evening, {learner.name} 👋
        </h1>

        <p className="mt-2 muted">
          Continue toward{' '}
          <span className="text-slate-200">
            {learner.careerGoal}
          </span>
          .
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <div className="mb-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-sm text-indigo-200">
          {notice}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Overall Progress', `${progress}%`, TrendingUp],
          ['Current Phase', current?.title || 'Complete', Target],
          [
            'Completed',
            phases.filter((p) => p.completed).length,
            CheckCircle2,
          ],
          ['Streak', '7 days', Flame],
        ].map(([a, b, I]) => (
          <div className="card p-5" key={a}>
            <I size={18} className="text-indigo-300" />

            <div className="mt-4 text-sm muted">
              {a}
            </div>

            <div className="mt-1 truncate text-xl font-bold">
              {b}
            </div>
          </div>
        ))}
      </div>

      {/* AI Action + Weekly Plan */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        {/* Next Best Action */}
        <section className="card overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500/15 to-transparent p-6">
            <Badge tone="indigo">AI Engine</Badge>

            <h2 className="mt-3 text-2xl font-bold">
              Your Next Best Action
            </h2>

            <p className="mt-4 text-lg font-semibold">
              {rec?.title || 'Continue your roadmap'}
            </p>

            <p className="mt-2 text-sm leading-6 muted">
              {rec?.reason ||
                'Complete the next available milestone.'}
            </p>

            <Time>
              {rec?.duration || '30 minutes'}
            </Time>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={complete}
                disabled={!current}
              >
                Complete Current Phase
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  setNotice(
                    'Based on goal, skill gaps, prerequisites, progress and feedback.'
                  )
                }
              >
                Why this?
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-3 flex justify-between text-sm">
              <span>Roadmap progress</span>
              <span>{progress}%</span>
            </div>

            <ProgressBar value={progress} />
          </div>
        </section>

        {/* Weekly Plan */}
        <section className="card p-6">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-indigo-300"
            />

            <h2 className="font-semibold">
              AI Weekly Plan
            </h2>
          </div>

          <p className="mt-2 text-xs muted">
            {learner.weeklyHours} hrs/week ·{' '}
            {learner.targetDuration}
          </p>

          <div className="mt-5 space-y-3">
            {(week?.plan || []).map((x, i) => (
              <div
                className="rounded-xl bg-white/5 p-3"
                key={i}
              >
                <div className="flex justify-between text-sm">
                  <span>{x.day}</span>
                  <span className="text-indigo-300">
                    {x.duration}
                  </span>
                </div>

                <div className="mt-1 text-sm font-medium">
                  {x.task}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Skill Gap + Progress Insight */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Skill Gap Analysis */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                AI Skill Gap Analysis
              </h2>

              <p className="mt-1 text-xs muted">
                Current vs required proficiency
              </p>
            </div>

            <Target className="text-indigo-300" />
          </div>

          <div className="mt-5">
            <SkillGapRadar gaps={gaps} />
          </div>
        </section>

        {/* AI Progress Insight */}
        <section className="card p-6">
          <div className="flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-indigo-300"
            />

            <h2 className="text-lg font-semibold">
              AI Progress Insight
            </h2>
          </div>

          <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm leading-6 text-slate-300">
            {insight?.summary ||
              'Your progress insight will appear after roadmap activity.'}
          </div>

          {insight?.focus && (
            <div className="mt-4 rounded-xl bg-indigo-500/10 p-4">
              <div className="text-xs text-indigo-300">
                Recommended focus
              </div>

              <div className="font-semibold">
                {insight.focus}
              </div>
            </div>
          )}

          <button
            className="mt-4 flex gap-2 text-sm text-indigo-300"
            onClick={async () => {
              setNotice('Refreshing AI...');

              try {
                const [a, i, w] = await Promise.all([
                  api.nextAction(),
                  api.progressInsight(),
                  api.weeklyPlan(),
                ]);

                setRec(a);
                setInsight(i);
                setWeek(w);

                setNotice(
                  `Recommendations refreshed for ${learner.careerGoal}.`
                );
              } catch (e) {
                setNotice(e.message);
              }
            }}
          >
            <RefreshCw size={15} />
            Refresh AI recommendations
          </button>
        </section>
      </div>

      {/* Feedback */}
      <div className="mt-5 card p-5">
        <div className="mb-3 text-sm font-semibold">
          How is this recommendation feeling?
        </div>

        <FeedbackButtons onFeedback={feedback} />
      </div>

      {/* Quick Actions */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/assessment"
          className="card p-5 hover:border-indigo-400/30"
        >
          <div className="text-sm font-semibold">
            🧠 Skill Assessment
          </div>

          <div className="mt-1 text-xs muted">
            Refine your real skill levels.
          </div>
        </a>

        <a
          href="/projects"
          className="card p-5 hover:border-indigo-400/30"
        >
          <div className="text-sm font-semibold">
            🚀 Project Lab
          </div>

          <div className="mt-1 text-xs muted">
            Generate a goal-aligned project.
          </div>
        </a>

        <a
          href="/review"
          className="card p-5 hover:border-indigo-400/30"
        >
          <div className="text-sm font-semibold">
            📊 AI Review
          </div>

          <div className="mt-1 text-xs muted">
            See strengths and focus areas.
          </div>
        </a>

        <a
          href="/interview"
          className="card p-5 hover:border-indigo-400/30"
        >
          <div className="text-sm font-semibold">
            🎤 Interview Mode
          </div>

          <div className="mt-1 text-xs muted">
            Practice with roadmap skills.
          </div>
        </a>
      </div>
    </div>
  );
}