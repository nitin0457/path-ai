import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Check,Plus,Sparkles} from 'lucide-react';
import {Button,Logo} from '../components/UI';
import {api} from '../lib/api';

const interestSuggestions=['Web Development','AI / ML','Data Science','Cybersecurity','Cloud','DevOps','UI/UX','Mobile Development'];

export default function Onboarding({learner,setLearner,setPath}) {
  const [step,setStep]=useState(1),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const [data,setData]=useState({
    name:learner?.name||'',
    experienceLevel:learner?.experienceLevel||'Intermediate',
    skills:learner?.skills||[],
    interests:learner?.interests||[],
    careerGoal:learner?.careerGoal||'',
    weeklyHours:learner?.weeklyHours||15,
    targetDuration:learner?.targetDuration||''
  });
  const [skill,setSkill]=useState(''); const nav=useNavigate();

  const addSkill=()=>{if(skill.trim()&&!data.skills.some(s=>s.name.toLowerCase()===skill.trim().toLowerCase()))setData(d=>({...d,skills:[...d.skills,{name:skill.trim(),level:40}]}));setSkill('')};

  const generate=async()=>{
    setError('');setLoading(true);
    try {
      const updated=await api.updateProfile(data);
      setLearner(updated);
      const result=await api.generateRoadmap(data);
      setPath(result.path);
      nav('/dashboard');
    } catch(err){setError(err.message)} finally{setLoading(false)}
  };

  return <div className="min-h-screen bg-[#070b16] text-white">
    <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Logo/><span className="text-sm muted">Step {step} of 4</span></header>
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-8">
      <div className="mb-8 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{width:`${step*25}%`}}/></div>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{step===1?'Tell us about you':step===2?'What do you already know?':step===3?'What interests you?':'What do you want to achieve?'}</h1>
        <p className="mt-2 text-sm muted">This information is sent to the backend AI to personalize your roadmap.</p>
        <div className="mt-8">
          {step===1&&<div className="space-y-5"><label className="block text-sm">Name<input value={data.name} onChange={e=>setData({...data,name:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><div><div className="mb-2 text-sm">Experience level</div><div className="grid gap-3 sm:grid-cols-3">{['Beginner','Intermediate','Advanced'].map(x=><button type="button" onClick={()=>setData({...data,experienceLevel:x})} className={`rounded-xl border p-4 text-sm ${data.experienceLevel===x?'border-indigo-400 bg-indigo-500/15 text-indigo-200':'border-white/10 bg-white/5'}`} key={x}>{x}</button>)}</div></div></div>}
          {step===2&&<div><div className="flex gap-2"><input value={skill} onChange={e=>setSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Add a skill" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 p-3"/><Button type="button" onClick={addSkill}><Plus size={16}/>Add</Button></div><div className="mt-5 space-y-2">{data.skills.length?data.skills.map((s,i)=><div className="flex items-center justify-between rounded-xl bg-white/5 p-3" key={i}><span>{s.name}</span><div className="flex items-center gap-2"><select value={s.level} onChange={e=>setData(d=>({...d,skills:d.skills.map((x,j)=>j===i?{...x,level:+e.target.value}:x)}))} className="rounded-lg border border-white/10 bg-[#101728] px-2 py-1 text-xs"><option value={20}>Beginner</option><option value={50}>Intermediate</option><option value={80}>Advanced</option></select></div></div>):<div className="rounded-xl bg-white/5 p-4 text-sm muted">No skills added yet. You can add what you know, or leave this empty and let the AI assessment discover your starting level.</div>}</div></div>}
          {step===3&&<div><div className="mb-4 flex gap-2"><input id="custom-interest" placeholder="Add your own interest" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 p-3" onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){const v=e.currentTarget.value.trim();setData(d=>d.interests.includes(v)?d:{...d,interests:[...d.interests,v]});e.currentTarget.value=''}}}/><Button type="button" onClick={()=>{const el=document.getElementById('custom-interest');const v=el?.value?.trim();if(v&&!data.interests.includes(v)){setData(d=>({...d,interests:[...d.interests,v]}));el.value=''}}}><Plus size={16}/>Add</Button></div><div className="grid grid-cols-2 gap-3">{interestSuggestions.map(x=>{const active=data.interests.includes(x);return <button type="button" key={x} onClick={()=>setData(d=>({...d,interests:active?d.interests.filter(i=>i!==x):[...d.interests,x]}))} className={`rounded-xl border p-4 text-left text-sm ${active?'border-indigo-400 bg-indigo-500/15':'border-white/10 bg-white/5'}`}>{active?<Check size={15} className="mb-3 text-indigo-300"/>:<Sparkles size={15} className="mb-3 text-slate-500"/>}{x}</button>})}</div></div>}
          {step===4&&<div className="space-y-5"><label className="block text-sm">Career goal<textarea value={data.careerGoal} onChange={e=>setData({...data,careerGoal:e.target.value})} rows="5" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Hours / week<input type="number" min="1" value={data.weeklyHours} onChange={e=>setData({...data,weeklyHours:+e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label><label className="text-sm">Target duration<input value={data.targetDuration} onChange={e=>setData({...data,targetDuration:e.target.value})} placeholder="e.g. 6 months" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3"/></label></div></div>}
        </div>
        {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        <div className="mt-8 flex justify-between"><Button type="button" variant="secondary" disabled={step===1||loading} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/>Back</Button>{step<4?<Button type="button" onClick={()=>setStep(step+1)}>Continue <ArrowRight size={16}/></Button>:<Button type="button" onClick={generate} disabled={loading}>{loading?<><Sparkles size={16} className="animate-pulse"/>AI is building...</>:<>Generate My Learning Path <ArrowRight size={16}/></>}</Button>}</div>
        {loading&&<div className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm text-indigo-200">AI is analyzing your profile, finding gaps and building your personalized roadmap...</div>}
      </div>
    </main>
  </div>
}
