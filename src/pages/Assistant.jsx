import { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Button } from '../components/UI';
import { api } from '../lib/api';

const prompts = [
  'What should I learn today?',
  'Why is React next?',
  'Can I skip this topic?',
  'Give me a project.',
  'Explain promises.',
  'What should I learn next?',
];

export default function Assistant({ learner }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi ${learner.name}! I know your goal is ${learner.careerGoal}. Ask me what to learn next, why a topic matters, or for a project.`,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (q) => {
    const text = (q ?? input).trim();

    if (!text || loading) return;

    setMessages((m) => [
      ...m,
      {
        role: 'user',
        text,
      },
    ]);

    setInput('');
    setLoading(true);

    try {
      const result = await api.chat(text);

      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: result.answer,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: `I couldn't reach the learning AI: ${e.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-300">
          <Sparkles size={16} />
          AI Learning Mentor
        </div>

        <h1 className="mt-1 text-3xl font-bold">
          LearnPath AI
        </h1>

        <p className="mt-2 muted">
          Your questions are answered using your saved profile
          and learning path.
        </p>
      </div>

      {/* Chat Container */}
      <div className="card flex min-h-[620px] flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : ''
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  m.role === 'ai'
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {m.role === 'ai' ? (
                  <Bot size={17} />
                ) : (
                  <UserRound size={17} />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  m.role === 'ai'
                    ? 'bg-white/5 text-slate-200'
                    : 'bg-indigo-500 text-white'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-sm muted">
              AI is thinking...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && send()
              }
              placeholder="Ask your learning assistant..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />

            <Button
              onClick={() => send()}
              disabled={loading}
            >
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}