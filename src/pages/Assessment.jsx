import { useEffect, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Target,
} from 'lucide-react';

import { Badge, Button, ProgressBar } from '../components/UI';
import { api } from '../lib/api';

export default function Assessment() {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .assessment()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    setSaving(true);

    try {
      const result = await api.submitAssessment({
        answers: Object.entries(answers).map(([id, score]) => {
          const q = data.questions.find((x) => x.id === id);

          return {
            skill: q.skill,
            score,
          };
        }),
      });

      setDone(result);

      if (result.path) {
        window.dispatchEvent(
          new Event('learnpath:path-updated')
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="animate-spin text-indigo-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-rose-300">
        {error}
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-8 text-center">
          <CheckCircle2
            size={48}
            className="mx-auto text-emerald-300"
          />

          <h1 className="mt-4 text-3xl font-bold">
            Assessment complete
          </h1>

          <p className="mt-2 muted">
            Your skill estimates were saved and your roadmap was
            adapted to your career goal.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {done.updates.map((x) => (
              <div
                className="rounded-xl bg-white/5 p-4 text-left"
                key={x.skill}
              >
                <div className="font-semibold">
                  {x.skill}
                </div>

                <div className="mt-2">
                  <ProgressBar value={x.level} />
                </div>

                <div className="mt-1 text-xs muted">
                  Estimated {x.level}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 text-indigo-300">
          <Brain size={18} />
          AI Skill Assessment
        </div>

        <h1 className="mt-2 text-3xl font-bold">
          Measure what you actually know
        </h1>

        <p className="mt-2 muted">
          This assessment is generated from your career goal,
          roadmap and skill gaps so the questions match the role
          you are preparing for.
        </p>
      </div>

      {/* Assessment Info */}
      <div className="mb-5 card p-5">
        <div className="flex items-center gap-2">
          <Target
            size={17}
            className="text-indigo-300"
          />

          <span className="font-semibold">
            {data.title}
          </span>

          <Badge tone="indigo">
            {Object.keys(answers).length}/
            {data.questions.length}
          </Badge>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {data.questions.map((q, i) => (
          <div className="card p-6" key={q.id}>
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-sm text-indigo-300">
                {i + 1}
              </span>

              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  {q.skill}
                </div>

                <h2 className="mt-1 font-semibold leading-6">
                  {q.question}
                </h2>

                <div className="mt-4 grid gap-2">
                  {q.options.map((o) => (
                    <button
                      key={o.score}
                      onClick={() =>
                        setAnswers((a) => ({
                          ...a,
                          [q.id]: o.score,
                        }))
                      }
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        answers[q.id] === o.score
                          ? 'border-indigo-400 bg-indigo-500/10 text-indigo-100'
                          : 'border-white/10 bg-white/[.03] text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <Button
        className="mt-6 w-full sm:w-auto"
        disabled={
          saving ||
          Object.keys(answers).length !==
            data.questions.length
        }
        onClick={submit}
      >
        {saving ? 'Saving...' : 'Submit Assessment'}
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}