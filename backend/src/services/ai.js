import { env } from '../config/env.js';

const clamp=(v,min=0,max=100)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;};
const clean=(v,fallback='')=>String(v??fallback).trim();

export function cleanCareerGoal(value, fallback='your target career'){
  let s=clean(value,fallback).replace(/\s+/g,' ').trim();
  if(!s) return fallback;
  // Convert onboarding sentences into a clean role title.
  s=s.replace(/^(?:i\s+)?(?:want|would\s+like|wish)\s+to\s+(?:become|be|work\s+as)\s+(?:an?\s+)?/i,'');
  s=s.replace(/^(?:my\s+career\s+goal\s+is\s+(?:to\s+)?)|^(?:become\s+(?:an?\s+)?)/i,'');
  s=s.replace(/\s*(?:for|within|in)\s+\d+\s+(?:days?|weeks?|months?|years?)\.?\s*$/i,'');
  s=s.replace(/[.!?]+$/,'').trim();
  return s || fallback;
}

export function isGoalLikeSkill(name){
  const s=clean(name).toLowerCase();
  return !s || s.length>70 || /^(i want|i would like|want to become|become a|my goal|career goal)/i.test(s) || /\b(in|within)\s+\d+\s+(day|days|week|weeks|month|months|year|years)\b/i.test(s);
}

function youtubeUrl(skill,goal=''){return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} ${goal} tutorial lecture`)}`;}
function articleUrl(skill,goal=''){
  const s=skill.toLowerCase();
  const map={
    'html':'https://developer.mozilla.org/en-US/docs/Learn/HTML','css':'https://developer.mozilla.org/en-US/docs/Learn/CSS',
    'javascript':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide','react':'https://react.dev/learn','node':'https://nodejs.org/en/learn','express':'https://expressjs.com/en/starter/basic-routing.html','mongodb':'https://www.mongodb.com/docs/manual/introduction/',
    'rest api':'https://developer.mozilla.org/en-US/docs/Glossary/REST','authentication':'https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication','testing':'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing','deployment':'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Deployment',
    'python':'https://docs.python.org/3/tutorial/','statistics':'https://www.khanacademy.org/math/statistics-probability','linear algebra':'https://www.khanacademy.org/math/linear-algebra','sql':'https://www.postgresql.org/docs/current/tutorial.html','numpy':'https://numpy.org/learn/','pandas':'https://pandas.pydata.org/docs/getting_started/intro_tutorials/','data visualization':'https://matplotlib.org/stable/tutorials/','machine learning':'https://scikit-learn.org/stable/user_guide.html','deep learning':'https://pytorch.org/tutorials/','model deployment':'https://fastapi.tiangolo.com/',
    'networking':'https://www.cisco.com/c/en/us/support/docs/ip/index.html','linux':'https://linuxjourney.com/','web security':'https://owasp.org/www-project-top-ten/','cryptography':'https://cryptography.io/en/latest/','security testing':'https://owasp.org/www-project-web-security-testing-guide/','incident response':'https://www.cisa.gov/topics/cyber-threats-and-advisories',
    'cloud':'https://aws.amazon.com/training/','docker':'https://docs.docker.com/get-started/','containers':'https://docs.docker.com/get-started/','ci/cd':'https://docs.github.com/en/actions','terraform':'https://developer.hashicorp.com/terraform/docs','figma':'https://help.figma.com/hc/en-us','ux':'https://www.nngroup.com/topic/user-research/','wireframing':'https://www.nngroup.com/articles/wireframes/','prototyping':'https://help.figma.com/hc/en-us/articles/360040314193','design system':'https://m3.material.io/'
  };
  for(const [key,url] of Object.entries(map)) if(s.includes(key)) return url;
  return `https://www.google.com/search?q=${encodeURIComponent(`${skill} ${goal} learning guide`)}`;
}

function resourcesFor(skill,goal,phaseIndex,resources=[]){
  const list=Array.isArray(resources)?resources.filter(r=>r&&r.url).map((r,i)=>({id:String(r.id||`resource-${phaseIndex+1}-${i+1}`),title:clean(r.title,`${skill} resource`),type:clean(r.type,'Learning Resource'),duration:clean(r.duration,'45 min'),url:String(r.url),description:clean(r.description,`Learn ${skill} and apply it in this phase.`),qualityScore:clamp(r.qualityScore||88),relevance:clean(r.relevance,'High'),completed:false})):[];
  const hasVideo=list.some(r=>/youtube|video|lecture/i.test(`${r.type} ${r.title} ${r.url}`));
  const hasArticle=list.some(r=>/article|documentation|guide|docs|reading/i.test(`${r.type} ${r.title}`));
  if(!hasVideo) list.unshift({id:`resource-${phaseIndex+1}-youtube`,title:`${skill} — YouTube lecture`,type:'YouTube Lecture',duration:'45 min',url:youtubeUrl(skill,goal),description:`Watch a focused lecture on ${skill}.`,qualityScore:86,relevance:'High',completed:false});
  if(!hasArticle) list.push({id:`resource-${phaseIndex+1}-article`,title:`${skill} — Article / Guide`,type:'Article / Guide',duration:'30 min',url:articleUrl(skill,goal),description:`Read a reliable guide for ${skill}.`,qualityScore:90,relevance:'High',completed:false});
  return list;
}

// Single source of truth for goal -> canonical skill track, shared with
// featureController so the assessment / project generators never fall back
// to a different (or no) track than the roadmap uses. Previously this list
// was duplicated in featureController.js and could drift out of sync, and
// any career goal that matched *none* of the tracks (e.g. "Robotics
// Engineer", "Game Developer") fell through to raw, unfiltered DB fields —
// which is how literal onboarding sentences like "I want to become an AI
// Engineer" ended up rendered as a "skill" in some places.
export function canonicalTrackFor(goal){
  const g=String(goal||'').toLowerCase();
  if(/ai|machine learning|ml engineer|artificial intelligence/.test(g)) return ['Python','Linear Algebra','Statistics','NumPy','Pandas','Machine Learning','Deep Learning','Model Deployment','AI Portfolio Project'];
  if(/data scientist|data science|data analyst|analytics/.test(g)) return ['Python','Statistics','SQL','Pandas','NumPy','Data Visualization','Machine Learning','Portfolio Project'];
  if(/cyber|security|ethical hacking|soc/.test(g)) return ['Networking','Linux','Web Security','Cryptography','Security Testing','Incident Response','Security Portfolio Project'];
  if(/cloud|devops|sre|site reliability/.test(g)) return ['Linux','Networking','Cloud Fundamentals','Containers','CI/CD','Infrastructure as Code','Monitoring','Cloud Project'];
  if(/ui.?ux|ux designer|ui designer|product designer|design/.test(g)) return ['Design Principles','Figma','UX Research','Wireframing','Prototyping','Design Systems','Usability Testing','UX Portfolio Project'];
  if(/mern|full.?stack|web developer|frontend|backend|software developer/.test(g)) return ['HTML & CSS','JavaScript','React','Node.js','Express','MongoDB','REST APIs','Authentication','Testing','Deployment'];
  return null;
}

function inferSkills(profile){
  const goal=cleanCareerGoal(profile.careerGoal,'your target career');
  const supplied=(profile.skills||[]).map(s=>({name:clean(s?.name),level:clamp(s?.level)})).filter(s=>!isGoalLikeSkill(s.name));
  const names=supplied.map(s=>s.name.toLowerCase());
  const add=(name)=>{if(!names.includes(name.toLowerCase())){supplied.push({name,level:0});names.push(name.toLowerCase());}};
  const canonical=canonicalTrackFor(goal);
  if(canonical){
    // For known career tracks, ignore unrelated onboarding skills such as HTML/CSS
    // when the learner selected AI/ML, Cybersecurity, etc. Preserve levels only for matching skills.
    const levels=new Map(supplied.map(s=>[s.name.toLowerCase(),s.level]));
    return canonical.map(name=>({name,level:levels.get(name.toLowerCase())??0}));
  }
  ['Foundations','Core Concepts','Applied Practice','Portfolio Project'].forEach(add);
  return supplied.slice(0,12);
}

function buildFallback(profile){
  const goal=cleanCareerGoal(profile.careerGoal,'your target career');
  const skills=inferSkills(profile);
  // Compute each phase's title up front so prerequisites can reference the
  // *actual* previous phase title. Storing the raw skill name here instead
  // (as before) never matched any phase title (e.g. "Python" vs "Python
  // Fundamentals"), so the Roadmap flowchart could never resolve dependency
  // levels and collapsed every phase into a single stage.
  const titles=skills.map(s=>/project/i.test(s.name)?s.name:`${s.name} Fundamentals`);
  const phases=skills.map((skill,i)=>{
    const prev=i? [titles[i-1]]:[];
    const project=/project/i.test(skill.name);
    const level=clamp(skill.level);
    const weeks=Math.max(1,Math.ceil((100-level)/35));
    return {
      id:`phase-${i+1}`,
      title:titles[i],
      description:project?`Build a portfolio-ready project for ${goal}.`:`Learn and apply ${skill.name} toward ${goal}.`,
      duration:`${weeks} week${weeks===1?'':'s'}`,
      skills:[skill.name],prerequisites:prev,
      resources:resourcesFor(skill.name,goal,i),
      task:{title:project?`Build a ${goal} portfolio project`:`Practice ${skill.name} with a real-world task`,instructions:project?`Build a usable project for ${goal}, document your decisions and test the main flow.`:`Complete a hands-on ${skill.name} exercise, handle one edge case and explain your solution.`,estimatedTime:`${Math.max(1,Math.min(6,weeks+1))} hours`,completed:false},
      assessment:{title:`${skill.name} checkpoint`,type:'Practical checkpoint',questions:[`Given a realistic ${skill.name} problem, describe the approach you would take.`,`What would you test or debug if your first solution failed?`],completed:false},
      project:project?`Portfolio project for ${goal}`:`Mini project using ${skill.name}`,
      status:i===0?'current':'locked',completed:false
    };
  });
  return {goal,skillGaps:skills.map(s=>({skill:s.name,current:clamp(s.level),required:80,importance:s.level<40?'High':s.level<65?'Medium':'Low'})).filter(g=>g.current<g.required),roadmap:phases,nextAction:{title:phases[0]?.title||'Start your personalized roadmap',reason:phases[0]?`This is the first dependency-aware step toward ${goal}.`:`Start building skills for ${goal}.`,duration:phases[0]?.task?.estimatedTime||'45 minutes'}};
}

function normalizeResult(raw,profile){
  const fallback=buildFallback(profile); const source=raw&&typeof raw==='object'?raw:{};
  const rawPhases=Array.isArray(source.roadmap)&&source.roadmap.length?source.roadmap:fallback.roadmap;
  const roadmap=rawPhases.map((p,i)=>{
    const skills=(Array.isArray(p?.skills)?p.skills:[]).map(clean).filter(s=>s&&!isGoalLikeSkill(s));
    const fallbackPhase=fallback.roadmap[i]||fallback.roadmap[fallback.roadmap.length-1];
    const phaseSkills=skills.length?skills:(fallbackPhase?.skills||[clean(p?.title,`Topic ${i+1}`)]);
    return {
      id:clean(p?.id,`phase-${i+1}`),title:clean(p?.title,`${phaseSkills[0]} Fundamentals`),description:clean(p?.description,`Learn and apply ${phaseSkills.join(', ')} toward ${profile.careerGoal||'your goal'}.`),duration:clean(p?.duration,'1 week'),skills:phaseSkills,
      prerequisites:Array.isArray(p?.prerequisites)?p.prerequisites.map(clean).filter(Boolean):(i?[roadmapSafeTitle(rawPhases[i-1],fallbackPhase?.title)]:[]),
      resources:resourcesFor(phaseSkills[0],clean(source.goal,profile.careerGoal),i,p?.resources),
      task:{title:clean(p?.task?.title,projectTask(phaseSkills,profile.careerGoal)),instructions:clean(p?.task?.instructions,`Apply ${phaseSkills.join(', ')} in a practical task and handle an edge case.`),estimatedTime:clean(p?.task?.estimatedTime,'2 hours'),completed:false},
      assessment:{title:clean(p?.assessment?.title,`${phaseSkills[0]} checkpoint`),type:'Practical checkpoint',questions:Array.isArray(p?.assessment?.questions)&&p.assessment.questions.length?p.assessment.questions.map(q=>typeof q==='string'?q:clean(q?.question,q?.text)).filter(Boolean):[`Solve a practical problem using ${phaseSkills[0]}.`,`Explain how you would test and debug your solution.`],completed:false},
      project:clean(p?.project,`Mini project using ${phaseSkills.slice(0,2).join(' + ')}`),status:'locked',completed:false
    };
  });
  const seen=new Set(); roadmap.forEach((p,i)=>{p.prerequisites=p.prerequisites.filter(x=>{const k=String(x).toLowerCase();if(!k||seen.has(k))return true;return true});seen.add(p.title.toLowerCase());});
  let currentAssigned=false; roadmap.forEach(p=>{p.completed=false;p.status=!currentAssigned?'current':'locked';if(!currentAssigned)currentAssigned=true;});
  const gaps=(Array.isArray(source.skillGaps)?source.skillGaps:fallback.skillGaps).map((g,i)=>({skill:clean(g?.skill,fallback.skillGaps[i]?.skill||`Skill ${i+1}`),current:clamp(g?.current),required:clamp(g?.required||80),importance:['High','Medium','Low'].includes(g?.importance)?g.importance:'Medium'})).filter(g=>!isGoalLikeSkill(g.skill));
  return {goal:cleanCareerGoal(source.goal,profile.careerGoal||fallback.goal),skillGaps:gaps,roadmap,nextAction:{title:clean(source.nextAction?.title,roadmap[0]?.title||fallback.nextAction.title),reason:clean(source.nextAction?.reason,fallback.nextAction.reason),duration:clean(source.nextAction?.duration,roadmap[0]?.task?.estimatedTime||fallback.nextAction.duration)}};
}
function roadmapSafeTitle(p,fallback){return clean(p?.title,fallback||'Previous topic');}
function projectTask(skills,goal){return `Practice ${skills.slice(0,2).join(' + ')} with a real ${goal||'career'} task`;}

export async function analyzeLearningProfile(profile){
  const fallback=buildFallback(profile);
  if(!env.openaiKey)return fallback;
  const prompt=`Create a personalized learning roadmap. Return ONLY JSON. Learner: ${JSON.stringify({...profile, careerGoal: cleanCareerGoal(profile.careerGoal)})}. Use the normalized careerGoal exactly; do not turn the full goal sentence into a skill. Use actual skills and infer only skills relevant to the stated goal. Return goal, skillGaps, roadmap and nextAction. Roadmap should have 6-12 meaningful topics, dependency-ordered. Every topic needs skills, prerequisites, duration, a YouTube resource, an article/documentation resource, practical task, checkpoint questions and project. Never mark any new phase completed.`;
  try{
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.openaiKey}`},body:JSON.stringify({model:env.openaiModel,messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}],temperature:0.2,response_format:{type:'json_object'}})});
    if(!r.ok)return fallback;
    const d=await r.json(); return normalizeResult(JSON.parse(d.choices?.[0]?.message?.content||'{}'),profile);
  }catch(e){console.error('AI roadmap fallback:',e.message);return fallback;}
}

export async function chatWithAI(profile,message,path){
  if(!env.openaiKey){const current=path?.phases?.find(p=>p.status==='current');return `Your goal is ${profile.careerGoal||'your target role'}. Your current step is ${current?.title||'the next roadmap topic'}. ${current?.resources?.[0]?.title?`Start with ${current.resources[0].title}.`:''}`;}
  try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.openaiKey}`},body:JSON.stringify({model:env.openaiModel,messages:[{role:'system',content:'You are a concise personalized learning mentor. Never invent completed work.'},{role:'user',content:`Profile: ${JSON.stringify(profile)}\nPath: ${JSON.stringify(path)}\nQuestion: ${message}`}],temperature:0.4})});if(!r.ok)throw new Error('AI unavailable');const d=await r.json();return d.choices?.[0]?.message?.content||'I could not generate a response.';}catch{return 'The AI service is temporarily unavailable. Continue with the current roadmap topic and resources.';}
}
