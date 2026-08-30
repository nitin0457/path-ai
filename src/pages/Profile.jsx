import {useMemo, useState} from 'react';
import {Save} from 'lucide-react';
import {Button,Badge,SkillBar} from '../components/UI';
import {api} from '../lib/api';

export default function Profile({learner,setLearner,path}) {
  const [draft,setDraft]=useState(learner),[saved,setSaved]=useState(false),[error,setError]=useState('');
  const save=async()=>{setError('');try{const updated=await api.updateProfile(draft);setLearner(updated);setDraft(updated);setSaved(true);setTimeout(()=>setSaved(false),2000);
    // Changing the career goal here used to leave the old roadmap in place
    // until the next full page reload (getPath() self-heals, but nothing
    // told the app to call it again). Dispatching this event makes App.jsx
    // refetch immediately, so the roadmap/assessment/projects update to the
    // new goal right away instead of silently staying stale.
    window.dispatchEvent(new Event('learnpath:path-updated'));
  }catch(e){setError(e.message)}};
  const currentSkills=useMemo(()=>{
    const source=Array.isArray(draft.careerRelevantSkills)?draft.careerRelevantSkills:(Array.isArray(draft.skills)?draft.skills:[]);
    const roadmapSkills=new Set((path?.phases||[]).flatMap(p=>p.skills||[]).map(s=>String(s).trim().toLowerCase()).filter(Boolean));
    const gapSkills=new Set((path?.skillGaps||[]).map(g=>String(g.skill||'').trim().toLowerCase()).filter(Boolean));
    const allowed=new Set([...roadmapSkills,...gapSkills]);
    const cleaned=source.filter(s=>{
      const name=String(s?.name||'').trim();
      if(!name || name.length>70) return false;
      if(/^(i want|i would like|want to become|become a|my goal|career goal)/i.test(name)) return false;
      // When a generated career path exists, it is the source of truth for
      // what is relevant to the selected career goal.
      return !allowed.size || allowed.has(name.toLowerCase());
    });
    return cleaned;
  },[draft.skills,path]);

  return <div className="mx-auto max-w-4xl"><div className="mb-7"><h1 className="text-3xl font-bold">Profile</h1><p className="mt-2 muted">Keep your learning profile accurate so AI recommendations stay relevant.</p></div><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><section className="card p-6"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm">Name<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><label className="text-sm">Experience<select value={draft.experienceLevel} onChange={e=>setDraft({...draft,experienceLevel:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101728] p-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><label className="mt-5 block text-sm">Career goal<textarea value={draft.careerGoal} onChange={e=>setDraft({...draft,careerGoal:e.target.value})} rows="4" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm">Hours per week<input type="number" value={draft.weeklyHours} onChange={e=>setDraft({...draft,weeklyHours:+e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><label className="text-sm">Target duration<input value={draft.targetDuration} onChange={e=>setDraft({...draft,targetDuration:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label></div>{error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}<div className="mt-6 flex items-center gap-3"><Button onClick={save}><Save size={16}/>Save Profile</Button>{saved&&<span className="text-sm text-emerald-300">Saved to MongoDB</span>}</div></section><aside className="card p-6"><h2 className="font-semibold">Current skills</h2><p className="mt-1 text-xs muted">Skills relevant to your career goal: {draft.careerGoal||'your target role'}</p><div className="mt-5 space-y-5">{currentSkills.length?currentSkills.map(s=><SkillBar key={s.name} name={s.name} value={s.level}/>):<div className="rounded-xl bg-white/5 p-4 text-sm muted">No career-aligned skills recorded yet. Complete the assessment to establish your starting level.</div>}</div><div className="mt-6 flex flex-wrap gap-2">{(draft.interests||[]).map(i=><Badge key={i} tone="indigo">{i}</Badge>)}</div></aside></div></div>
}
