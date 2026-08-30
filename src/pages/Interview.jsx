import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Mic2,
  MessageSquare,
  Target,
} from 'lucide-react';

import {
  Badge,
  Button,
  ProgressBar,
} from '../components/UI';

import { api } from '../lib/api';

export default function Interview() {
  const [d, setD] = useState(null);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    api.interview().then(setD);
  }, []);

  if (!d) {
    return (
      <div className="muted">
        Loading AI interview...
      </div>
    );
  }

  const q = d.questions[i];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 text-indigo-300">
          <Mic2 size={18} />
          AI Interview Mode
        </div>

        <h1 className="mt-2 text-3xl font-bold">
          Practice for {d.role}
        </h1>

        <p className="mt-2 muted">
          Questions are selected from the skills in your
          personalized path.
        </p>
      </div>

      {/* Readiness */}
      <div className="mb-5 card p-5">
        <div className="flex justify-between text-sm">
          <span>Readiness estimate</span>
          <span>{d.readiness}%</span>
        </div>

        <div className="mt-2">
          <ProgressBar value={d.readiness} />
        </div>
      </div>

      {/* Interview Question */}
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Badge tone="indigo">
            {q.skill}
          </Badge>

          <span className="text-xs muted">
            Question {i + 1} of {d.questions.length}
          </span>
        </div>

        <h2 className="mt-5 text-xl font-semibold leading-7">
          {q.question}
        </h2>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows="7"
          placeholder="Explain your answer as if you were in a real interview..."
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 p-4 outline-none focus:border-indigo-400"
        />

        {/* Follow-up */}
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare
              size={16}
              className="text-indigo-300"
            />
            Follow-up
          </div>

          <p className="mt-2 text-sm leading-6 muted">
            {q.followUp}
          </p>
        </div>

        {/* Next Question */}
        <Button
          className="mt-5"
          disabled={!answer.trim()}
          onClick={() => {
            setAnswer('');
            setI(
              (x) => (x + 1) % d.questions.length
            );
          }}
        >
          {i === d.questions.length - 1
            ? 'Restart Interview'
            : 'Next Question'}

          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Interview Tip */}
      <div className="mt-5 card p-5">
        <div className="flex items-center gap-2 text-sm">
          <Target
            size={16}
            className="text-indigo-300"
          />
          Interview tip
        </div>

        <p className="mt-2 text-sm muted">
          Use a concrete example, explain your reasoning,
          and mention trade-offs instead of only defining
          the technology.
        </p>
      </div>
    </div>
  );
}