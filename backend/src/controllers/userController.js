import User from '../models/User.js';
import { cleanCareerGoal, canonicalTrackFor, isGoalLikeSkill } from '../services/ai.js';

function careerRelevantSkills(user){
  const goal=cleanCareerGoal(user.careerGoal,'');
  const canonical=canonicalTrackFor(goal);
  const skills=Array.isArray(user.skills)?user.skills:[];
  if(!canonical) return skills.filter(s=>!isGoalLikeSkill(s?.name));
  const allowed=new Set(canonical.map(s=>s.toLowerCase()));
  return skills.filter(s=>allowed.has(String(s?.name||'').trim().toLowerCase())&&!isGoalLikeSkill(s?.name));
}

function serializeUser(user){
  const data=user.toObject();
  data.careerRelevantSkills=careerRelevantSkills(data);
  return data;
}
export async function profile(req,res){const user=await User.findById(req.user.id).select('-password');if(!user)return res.status(404).json({message:'User not found'});const goal=cleanCareerGoal(user.careerGoal);if(goal!==user.careerGoal){user.careerGoal=goal;await user.save();}res.json(serializeUser(user));}
export async function updateProfile(req,res){const allowed=['name','experienceLevel','skills','interests','careerGoal','weeklyHours','targetDuration'];const updates={};for(const k of allowed)if(req.body[k]!==undefined)updates[k]=k==='careerGoal'?cleanCareerGoal(req.body[k]):req.body[k];const user=await User.findByIdAndUpdate(req.user.id,updates,{new:true,runValidators:true}).select('-password');res.json(serializeUser(user));}
