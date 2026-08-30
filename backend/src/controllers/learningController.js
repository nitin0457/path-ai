import User from '../models/User.js';
import LearningPath from '../models/LearningPath.js';
import Progress from '../models/Progress.js';
import { analyzeLearningProfile, cleanCareerGoal, isGoalLikeSkill, canonicalTrackFor } from '../services/ai.js';
import { env } from '../config/env.js';

function applyStatuses(phases, completedIds=new Set()){
  let currentFound=false;
  return phases.map((p)=>{
    const id=String(p.id||p._id||p.title);
    const completed=completedIds.has(id);
    const next={...p,completed,status:completed?'completed':(!currentFound?'current':'locked')};
    if(!completed&&!currentFound) currentFound=true;
    return next;
  });
}

async function savePath(user,result,{preserveProgress=false}={}){
  const old=preserveProgress?await LearningPath.findOne({userId:user._id}):null;
  const oldCompleted=new Set((old?.phases||[]).filter(p=>p.completed).map(p=>String(p.title||'').toLowerCase()));
  const phases=(result.roadmap||[]).map(p=>({...p,completed:false,status:'locked'}));
  const completedIds=new Set(phases.filter(p=>oldCompleted.has(String(p.title||'').toLowerCase())).map(p=>String(p.id||p.title)));
  const finalPhases=applyStatuses(phases,completedIds);
  const done=finalPhases.filter(p=>p.completed).length;
  return LearningPath.findOneAndUpdate({userId:user._id},{userId:user._id,goal:result.goal,skillGaps:result.skillGaps,phases:finalPhases,currentPhase:Math.max(0,finalPhases.findIndex(p=>p.status==='current')),progress:finalPhases.length?Math.round(done/finalPhases.length*100):0},{upsert:true,new:true,setDefaultsOnInsert:true});
}

export async function analyzeGoal(req,res){try{const user=await User.findById(req.user.id).select('-password');if(!user)return res.status(404).json({message:'User not found'});res.json(await analyzeLearningProfile({...user.toObject(),...req.body}));}catch(e){res.status(500).json({message:e.message});}}

export async function generateRoadmap(req,res){try{const user=await User.findById(req.user.id).select('-password');if(!user)return res.status(404).json({message:'User not found'});const result=await analyzeLearningProfile({...user.toObject(),...req.body});const path=await savePath(user,result,{preserveProgress:Boolean(req.body?.preserveProgress)});await User.findByIdAndUpdate(user._id,{onboardingCompleted:true});res.json({path,recommendation:result.nextAction});}catch(e){console.error(e);res.status(500).json({message:e.message||'Unable to generate roadmap'});}}

export async function getPath(req,res){
  try{
    const user=await User.findById(req.user.id).select('-password');
    if(!user)return res.status(404).json({message:'User not found'});
    const normalizedGoal=cleanCareerGoal(user.careerGoal);
    if(normalizedGoal!==user.careerGoal){ user.careerGoal=normalizedGoal; await user.save(); }
    let path=await LearningPath.findOne({userId:req.user.id});
    // Detect a stale/mismatched roadmap so it self-heals instead of quietly
    // showing content for a career goal the learner no longer has (e.g.
    // they changed their goal on the Profile page, which only updates the
    // user record and never used to trigger a regeneration on its own).
    // Reuses the same isGoalLikeSkill filter as the roadmap/assessment
    // generators so a stray onboarding sentence like "I want to become an
    // AI Engineer" is always recognised as broken data, not just the
    // couple of hardcoded phrasings this used to check for.
    // Only enforce the strict canonical skill-set check when there is no
    // OpenAI key configured — that's when the roadmap is guaranteed to be
    // built from the fixed canonical track, so any mismatch means it's
    // stale. With a real AI key the model is intentionally allowed to pick
    // real-world skill names outside that fixed list, so mismatches there
    // are normal, not "broken".
    const canonical=!env.openaiKey?canonicalTrackFor(normalizedGoal):null;
    const canonicalKeys=canonical?new Set(canonical.map(s=>s.toLowerCase())):null;
    const broken=path?.goal!==normalizedGoal
      || path?.phases?.some(p=>/^build\s/i.test(String(p.title||''))||p.skills?.some(s=>isGoalLikeSkill(String(s))))
      || (canonicalKeys && path?.phases?.some(p=>p.skills?.some(s=>s && !canonicalKeys.has(String(s).toLowerCase()))));
    const progressRows=path?await Progress.countDocuments({userId:req.user.id,completed:true}):0;
    if(path&&(broken||(path.phases.length>0&&path.phases.every(p=>p.completed)&&progressRows===0))){
      const result=await analyzeLearningProfile(user.toObject());
      path=await savePath(user,result,{preserveProgress:false});
    }
    res.json(path||null);
  }catch(e){console.error(e);res.status(500).json({message:e.message});}
}

export async function updateProgress(req,res){try{const {phaseId,completed=true}=req.body;if(!phaseId)return res.status(400).json({message:'phaseId is required'});const path=await LearningPath.findOne({userId:req.user.id});if(!path)return res.status(404).json({message:'Learning path not found'});const index=path.phases.findIndex(p=>String(p.id)===String(phaseId));if(index<0)return res.status(404).json({message:'Phase not found'});if(path.phases[index].status==='locked'&&completed)return res.status(409).json({message:'Complete the current topic first'});path.phases[index].completed=Boolean(completed);await Progress.findOneAndUpdate({userId:req.user.id,phaseId:String(phaseId)},{userId:req.user.id,phaseId:String(phaseId),completed:Boolean(completed),completedAt:completed?new Date():null},{upsert:true,new:true});let currentFound=false;path.phases.forEach(p=>{if(p.completed)p.status='completed';else if(!currentFound){p.status='current';currentFound=true;}else p.status='locked';});const done=path.phases.filter(p=>p.completed).length;path.progress=path.phases.length?Math.round(done/path.phases.length*100):0;path.currentPhase=Math.max(0,path.phases.findIndex(p=>p.status==='current'));await path.save();res.json(path);}catch(e){console.error(e);res.status(500).json({message:e.message});}}
