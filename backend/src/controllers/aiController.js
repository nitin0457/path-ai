import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import LearningPath from '../models/LearningPath.js';
import { chatWithAI, analyzeLearningProfile } from '../services/ai.js';

export async function chat(req, res) {
  const user = await User.findById(req.user.id).select('-password');
  const path = await LearningPath.findOne({ userId: req.user.id });
  const answer = await chatWithAI(user.toObject(), req.body.message || '', path);
  res.json({ answer });
}

export async function analyzeGoal(req, res) {
  const user = await User.findById(req.user.id).select('-password');
  const result = await analyzeLearningProfile({ ...user.toObject(), ...req.body });
  res.json(result);
}

export async function nextAction(req, res) {
  const user = await User.findById(req.user.id).select('-password');
  const path = await LearningPath.findOne({ userId: req.user.id });
  const feedback = await Feedback.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

  if (path) {
    const current = path.phases.find(p => p.status === 'current') || path.phases.find(p => !p.completed);
    if (!current) {
      return res.json({ title: 'Review your achievements', reason: 'You completed the current roadmap. Review your portfolio and choose a new goal when ready.', duration: '30 minutes' });
    }

    let reason = `This is the next prerequisite in your personalized sequence for ${path.goal}.`;
    if (feedback?.type === 'easy') reason += ' Your latest feedback says this felt too easy, so prioritize deeper practice or an advanced extension.';
    if (feedback?.type === 'hard') reason += ' Your latest feedback says this felt difficult, so add revision and prerequisite practice before moving on.';

    return res.json({ title: current.title, reason, duration: current.duration || '30 minutes' });
  }

  const result = await analyzeLearningProfile(user.toObject());
  res.json(result.nextAction);
}

export async function weeklyPlan(req, res) {
  const user = await User.findById(req.user.id).select('-password');
  const path = await LearningPath.findOne({ userId: req.user.id });
  const current = path?.phases?.find(p => p.status === 'current') || path?.phases?.find(p => !p.completed);
  res.json({
    hours: user.weeklyHours || 5,
    plan: [
      { day: 'Day 1', task: `Study ${current?.title || 'next topic'}`, duration: '60 min' },
      { day: 'Day 2', task: 'Practice core concepts', duration: '60 min' },
      { day: 'Day 3', task: 'Build a small implementation', duration: '90 min' },
      { day: 'Day 4', task: 'Review weak areas', duration: '45 min' },
      { day: 'Day 5', task: 'Apply skills in a mini project', duration: '90 min' },
      { day: 'Day 6', task: 'Self-assessment', duration: '45 min' }
    ]
  });
}

export async function progressInsight(req, res) {
  const path = await LearningPath.findOne({ userId: req.user.id });
  const done = path?.phases?.filter(p => p.completed).length || 0;
  const total = path?.phases?.length || 0;
  const focus = path?.skillGaps?.filter(g => g.current < g.required)
    .sort((x, y) => (y.required - y.current) - (x.required - x.current))[0]?.skill || 'your next milestone';
  res.json({
    summary: `You've completed ${done} of ${total} roadmap phases (${path?.progress || 0}%). Your largest remaining skill gap should guide your next practice cycle.`,
    focus
  });
}
