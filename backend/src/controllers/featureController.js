import User from '../models/User.js';
import LearningPath from '../models/LearningPath.js';
import Feedback from '../models/Feedback.js';
import { env } from '../config/env.js';
import { analyzeLearningProfile, cleanCareerGoal, canonicalTrackFor, isGoalLikeSkill } from '../services/ai.js';

const getContext=async userId=>{
  const [user,path]=await Promise.all([User.findById(userId).select('-password'),LearningPath.findOne({userId})]);
  if(user){
    const goal=cleanCareerGoal(user.careerGoal);
    if(goal && goal!==user.careerGoal){ user.careerGoal=goal; await user.save(); }
  }
  return {user,path};
};
async function askAI(system,payload,fallback){if(!env.openaiKey)return fallback();try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.openaiKey}`},body:JSON.stringify({model:env.openaiModel,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],temperature:.3,response_format:{type:'json_object'}})});if(!r.ok)return fallback();const d=await r.json();return JSON.parse(d.choices?.[0]?.message?.content||'{}');}catch{return fallback();}}

// Fisher-Yates shuffle — used so the same skill doesn't always produce the
// same question, and the same question doesn't always show its options in
// the same order. This is what makes "Generate Another" / retaking the
// assessment actually feel different each time, without needing a paid
// AI key or an unrelated third-party trivia API (which wouldn't have
// programming/AI-ML-specific questions anyway).
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

// 2-3 question variants per skill so re-fetching the assessment gives
// different questions, not the same fixed set every time. Every score set
// is kept distinct per-option so shuffling the option order never changes
// which option is "correct".
const questionBank={
  python:[
    ['You receive a list of numbers and need the average. Which approach is most appropriate?',['Use a loop or sum()/len() and handle an empty list.','Convert everything to strings first.','Use random values.','Avoid checking for an empty list.']],
    ['A Python program crashes on unexpected input. What should you do first?',['Inspect the traceback and reproduce the failing input.','Delete the failing function.','Ignore the exception.','Restart the computer.']],
    ['You need to process a large file without loading it fully into memory. What should you use?',['Iterate line-by-line or use a generator.','Read the whole file into one string first.','Copy the file repeatedly.','Store it in a global variable.']]
  ],
  javascript:[
    ['A fetch request is asynchronous. What is the correct way to use its result?',['Use async/await or a Promise chain and handle errors.','Assume the result is immediately available.','Use setTimeout for every request.','Convert the response to CSS.']],
    ['You need to avoid mutating the original array when adding an item. What should you do?',['Use spread/concat to create a new array.','Use array.push directly on the prop.','Reassign the array length to 0 first.','Convert it to a string.']]
  ],
  react:[
    ['A component needs to update when a user types. What should you use?',['State and an input change handler.','A database trigger only.','A CSS animation only.','A server restart.']],
    ['A component re-renders too often because of an inline function prop. What is a reasonable fix?',['Memoize the callback (e.g. useCallback) or move it out of the render path.','Delete the component.','Disable React entirely.','Use inline styles instead.']]
  ],
  'machine learning':[
    ['A model performs very well on training data but poorly on unseen data. What is the likely issue?',['Overfitting; use validation and regularization or simpler features/model.','Underfitting only.','A CSS issue.','The dataset must be sorted alphabetically.']],
    ['You want an honest estimate of how a model will perform on new data. What should you do?',['Hold out a validation/test set or use cross-validation.','Evaluate only on the training set.','Pick the model with the most parameters.','Skip evaluation and ship it.']]
  ],
  'deep learning':[
    ['Training loss keeps decreasing but validation loss starts rising. What is happening?',['The model is overfitting; add regularization, dropout or more data.','The learning rate is too low.','This is expected and can be ignored.','The GPU is broken.']],
    ['A deep network is not learning at all and loss stays flat. What should you check first?',['Learning rate, weight initialization and whether gradients are flowing.','The color of the terminal text.','The number of browser tabs open.','The model’s file name.']]
  ],
  'model deployment':[
    ['You need to serve a trained model to other applications. What is a reasonable approach?',['Wrap it behind a versioned API (e.g. REST/FastAPI) with input validation and monitoring.','Email the model file to users.','Retrain it on every request.','Hardcode predictions in the frontend.']]
  ],
  numpy:[
    ['You need to apply a calculation to every element of a large array efficiently. What should you use?',['Vectorized NumPy operations instead of Python loops.','A nested for-loop over each element.','Convert the array to a string first.','Sort the array before every operation.']]
  ],
  pandas:[
    ['A CSV has missing values in a numeric column. What is a reasonable first step?',['Inspect the missing values, then decide to drop or impute them appropriately.','Ignore them; pandas removes them automatically.','Replace the whole column with zeros without checking.','Delete the entire dataset.']]
  ],
  'data visualization':[
    ['You want to compare a value across many categories. Which chart type fits best?',['A bar chart.','A single pie slice.','A blank table.','A word cloud of numbers.']]
  ],
  statistics:[
    ['You want to summarize the center of a skewed dataset. Which measure is often more robust?',['Median.','Maximum.','Range only.','File size.']],
    ['A sample shows a difference between two groups. How do you check if it is likely real vs. chance?',['Run an appropriate hypothesis test and look at the p-value/effect size.','Assume it is always significant.','Only look at the sample size.','Repeat the exact same sample.']]
  ],
  sql:[
    ['You need rows from one table even when no matching row exists in another. Which join fits?',['LEFT JOIN.','INNER JOIN.','CROSS JOIN only.','DROP JOIN.']],
    ['A query against a large table is slow on a filtered column. What commonly helps?',['Add an appropriate index on that column.','Remove the WHERE clause.','Duplicate the table.','Disable the database.']]
  ],
  'linear algebra':[
    ['A vector is multiplied by a scalar. What happens?',['Each component is multiplied by that scalar.','Only the first component changes.','The vector becomes a string.','Its dimensions always double.']],
    ['Two matrices are multiplied together. What must be true about their dimensions?',['The number of columns in the first must match the rows in the second.','They must both be square.','They must have the same number of rows.','No dimension rule applies.']]
  ],
  html:[['Which semantic element best represents the primary content of a page?',['main','span','b','br']]],
  css:[['You need a layout that adapts across screen sizes. Which is appropriate?',['Responsive CSS using flexbox/grid and media/container queries.','Fixed pixel positioning for every element.','Only <br> tags.','A database query.']]],
  node:[['A Node.js server needs to handle many concurrent I/O requests efficiently. What should you rely on?',['Its non-blocking, event-driven I/O model with async APIs.','Blocking synchronous calls for everything.','A single very large loop.','Restarting the server per request.']]],
  express:[['You want the same authentication check to run before several routes. What should you use?',['Middleware applied to those routes.','Copy-pasting the check into every handler.','A CSS class.','A database trigger.']]],
  mongodb:[['You frequently query a collection by a specific field. What improves performance?',['Add an index on that field.','Store everything in one giant document.','Disable the query.','Duplicate the collection nightly.']]],
  'rest apis':[['A REST endpoint should indicate a resource was not found. Which status code fits?',['404.','200.','301.','500 for every case.']]],
  authentication:[['You need to keep a user logged in securely across requests. What is a reasonable approach?',['Use signed tokens (e.g. JWT) or secure sessions with proper expiry.','Store the password in plain text in the URL.','Trust a client-side flag with no server check.','Never expire sessions.']]],
  testing:[['You want confidence that a function behaves correctly after changes. What should you write?',['Automated unit tests covering normal and edge cases.','Nothing; test manually once.','Only test in production.','Delete the function if it looks risky.']]],
  deployment:[['You want to ship changes safely without downtime. What is a reasonable practice?',['Use CI/CD with staged rollouts and monitoring.','Edit files directly on the production server.','Deploy without testing.','Skip version control.']]],
  networking:[['Two devices need to communicate reliably with guaranteed delivery. Which protocol fits?',['TCP.','UDP for everything.','No protocol needed.','ICMP for data transfer.']]],
  linux:[['You need to find which process is using a lot of CPU on a Linux server. What should you use?',['top/htop or ps to inspect running processes.','Restart the machine immediately.','Delete random log files.','Ignore it.']]],
  'web security':[['A form submits user input directly into a SQL query string. What risk does this create?',['SQL injection; use parameterized queries.','No risk if the field is short.','It only affects styling.','It improves performance.']]],
  cryptography:[['You need to store user passwords safely. What should you do?',['Hash them with a strong, salted algorithm (e.g. bcrypt/argon2).','Store them in plain text.','Encrypt them with a hardcoded key in the frontend.','Email them to the admin.']]],
  'security testing':[['You want to find vulnerabilities in a web app before attackers do. What is a reasonable approach?',['Run structured penetration testing / vulnerability scanning against a scoped environment.','Guess randomly in production.','Skip testing since the app looks fine.','Only test the login page once.']]],
  'incident response':[['A security incident is detected in production. What should happen first?',['Contain the impact and preserve evidence while investigating.','Immediately wipe all logs.','Ignore it until next week.','Post details publicly right away.']]],
  'cloud fundamentals':[['You want compute that scales up and down with demand automatically. What should you use?',['Auto-scaling cloud instances/services.','A single fixed on-prem server.','A local laptop.','No infrastructure at all.']]],
  containers:[['You want an application to run the same way across different machines. What helps?',['Package it in a container with its dependencies.','Manually reinstall dependencies on every machine.','Hope the OS matches everywhere.','Skip packaging entirely.']]],
  'ci/cd':[['You want every code change to be automatically tested before merging. What should you set up?',['A CI pipeline that runs tests on each push/PR.','Manual testing only when you remember.','No automation.','Testing only after deployment.']]],
  'infrastructure as code':[['You want infrastructure changes to be reviewable and repeatable. What approach fits?',['Define infrastructure in version-controlled config (e.g. Terraform).','Click through the cloud console and remember what you did.','Keep infrastructure undocumented.','Change production manually each time.']]],
  monitoring:[['You want to know when a production service starts failing. What should you set up?',['Metrics, logging and alerting on key indicators.','Nothing; check manually once a week.','Only look at it after a user complains.','Disable logs to save space.']]],
  'design principles':[['You want a UI where the most important action stands out. What principle helps?',['Visual hierarchy (size, contrast, placement) to guide attention.','Making every element the same size and color.','Removing all whitespace.','Randomizing layout each visit.']]],
  figma:[['You want multiple team members to design consistent components. What should you use?',['A shared component library / design system in Figma.','Separate files with no shared styles.','Screenshots emailed back and forth.','No shared source of truth.']]],
  'ux research':[['You want to know if users understand a new flow before building it fully. What should you do?',['Run usability testing with real or representative users.','Assume it is fine and ship it.','Only ask the design team.','Skip research to save time.']]],
  wireframing:[['You are exploring layout options early in a project. What is an appropriate tool?',['Low-fidelity wireframes to test structure quickly.','A fully polished high-fidelity mockup for every idea.','Production code.','Nothing; jump straight to development.']]],
  prototyping:[['You want to test an interaction flow before development starts. What should you build?',['An interactive prototype.','The final production app.','A written description only.','Nothing, just describe it verbally.']]],
  'design systems':[['Multiple products need visually consistent buttons and colors. What helps most?',['A shared design system with reusable tokens/components.','Each team choosing its own colors freely.','Copy-pasting styles by eye each time.','No shared guidelines.']]],
  'usability testing':[['You want honest feedback on whether a feature is usable. What should you avoid?',['Leading questions that hint at the "right" answer.','Watching users complete real tasks.','Taking notes during the session.','Testing with a small representative group.']]]
};
function fallbackAssessment(user,path){
  const goal=cleanCareerGoal(user.careerGoal);
  // Use the exact same canonical track the roadmap uses, so the assessment
  // always matches the learner's actual career goal. If the goal doesn't
  // match a known track, fall back to the learner's real roadmap/skill data
  // — but still filtered through isGoalLikeSkill, so a stray onboarding
  // sentence (e.g. "I want to become an AI Engineer") never gets rendered
  // as if it were a skill.
  const canonical=canonicalTrackFor(goal);
  const track=canonical||[...(path?.skillGaps||[]).map(g=>g.skill),...(path?.phases||[]).flatMap(p=>p.skills||[]),...(user.skills||[]).map(s=>s.name)].filter(s=>s&&!isGoalLikeSkill(s));
  const fallbackTrack=track.length?track:['Foundations','Core Concepts','Applied Practice'];
  const skills=[...new Map(fallbackTrack.filter(Boolean).map(s=>[String(s).toLowerCase(),String(s)])).values()].slice(0,10);
  const questions=[];skills.forEach((skill,si)=>{
    const key=Object.keys(questionBank).find(k=>skill.toLowerCase().includes(k));
    if(key&&questionBank[key].length){
      const q=pick(questionBank[key]);
      const scores=[100,45,20,10];
      const options=shuffle(q[1].map((label,i)=>({label,score:scores[i]})));
      questions.push({id:`q-${si}-${Date.now()}-${Math.floor(Math.random()*1e6)}`,skill,question:q[0],options});
    } else {
      const options=shuffle([
        {label:'Break the problem into steps, choose an appropriate approach and test the result.',score:90},
        {label:'Follow an example and modify it while checking the result.',score:65},
        {label:'Search for a solution and use it without testing.',score:35},
        {label:'Wait for someone else to solve it.',score:10}
      ]);
      questions.push({id:`q-${si}-${Date.now()}-${Math.floor(Math.random()*1e6)}`,skill,question:`You need to solve a real ${skill} task for ${user.careerGoal||'your target role'}. What would you do first?`,options});
    }
  });
  return {title:`Adaptive assessment for ${user.careerGoal||'your goal'}`,questions:shuffle(questions).slice(0,10)};
}
export async function assessment(req,res){const {user,path}=await getContext(req.user.id);if(!user)return res.status(404).json({message:'User not found'});user.careerGoal=cleanCareerGoal(user.careerGoal); const fallback=()=>fallbackAssessment(user,path);const data=await askAI('Create 6-10 practical multiple-choice questions from this learner goal, roadmap and skill gaps. Do not ask self-rating questions. Every option must reflect a different quality of solution and include a 0-100 score. Never turn the goal sentence into a skill.',{profile:user,path},fallback);const fb=fallback();const questions=Array.isArray(data.questions)&&data.questions.length?data.questions.slice(0,10).map((q,i)=>({id:String(q.id||`q-${i+1}`),skill:String(q.skill||fb.questions[i]?.skill||'Core skill'),question:String(q.question||fb.questions[i]?.question||'Apply this skill to a practical problem.'),options:Array.isArray(q.options)&&q.options.length>=4?q.options.slice(0,4).map(o=>({label:String(o.label),score:Math.max(0,Math.min(100,Number(o.score)||0))})):fb.questions[i]?.options||[]})):fb.questions;res.json({title:String(data.title||fb.title),questions});}

export async function submitAssessment(req,res){const user=await User.findById(req.user.id);if(!user)return res.status(404).json({message:'User not found'});const answers=Array.isArray(req.body?.answers)?req.body.answers:[];const updates=[];for(const a of answers){if(!a?.skill)continue;const level=Math.max(0,Math.min(100,Number(a.score)||0));const existing=user.skills.find(s=>s.name.toLowerCase()===String(a.skill).toLowerCase());if(existing)existing.level=Math.round(existing.level*.4+level*.6);else user.skills.push({name:String(a.skill),level});updates.push({skill:String(a.skill),level});}await user.save();let path=null;try{const result=await analyzeLearningProfile(user.toObject());const old=await LearningPath.findOne({userId:user._id});const completed=new Set((old?.phases||[]).filter(p=>p.completed).map(p=>String(p.title).toLowerCase()));const phases=result.roadmap.map(p=>({...p,completed:completed.has(String(p.title).toLowerCase()),status:'locked'}));let current=false;phases.forEach(p=>{if(p.completed)p.status='completed';else if(!current){p.status='current';current=true}else p.status='locked'});const done=phases.filter(p=>p.completed).length;path=await LearningPath.findOneAndUpdate({userId:user._id},{userId:user._id,goal:result.goal,skillGaps:result.skillGaps,phases,currentPhase:Math.max(0,phases.findIndex(p=>p.status==='current')),progress:phases.length?Math.round(done/phases.length*100):0},{upsert:true,new:true,setDefaultsOnInsert:true});}catch(e){console.error('assessment roadmap refresh:',e.message)}res.json({message:'Assessment saved and roadmap adapted',updates,path});}

// Several distinct "angles" for a project brief on the same weak skill, so
// clicking "Generate Another" with no AI key configured doesn't just
// return the exact same project again (which is what was happening before
// — the fallback was fully deterministic from the same inputs).
const projectAngles=[
  {label:'a real-world tool',brief:(weakest,goal)=>`Build a small but real tool for someone working toward ${goal} that puts ${weakest} at the center of the solution.`},
  {label:'a data/analysis challenge',brief:(weakest,goal)=>`Take a realistic dataset or scenario relevant to ${goal} and build something that analyzes or processes it, deliberately exercising ${weakest}.`},
  {label:'an end-to-end mini product',brief:(weakest,goal)=>`Design and build an end-to-end mini product for ${goal} where ${weakest} is the hardest, most important part to get right.`},
  {label:'an automation/pipeline',brief:(weakest,goal)=>`Automate a repetitive task someone in a ${goal} role would face, using ${weakest} as the core technique.`},
  {label:'a debugging/optimization challenge',brief:(weakest,goal)=>`Start from a deliberately imperfect solution relevant to ${goal} and rebuild/optimize it, focusing on strengthening ${weakest}.`}
];
export async function generateProject(req,res){
  const {user,path}=await getContext(req.user.id);
  if(!user)return res.status(404).json({message:'User not found'});
  const current=path?.phases?.find(p=>p.status==='current')||path?.phases?.find(p=>!p.completed);
  const gaps=(path?.skillGaps||[]).filter(g=>g.current<g.required).sort((a,b)=>(b.required-b.current)-(a.required-a.current));
  const weakest=gaps[0]?.skill||current?.skills?.[0]||user.skills?.[0]?.name||'your weakest skill';
  const excludeTitle=String(req.body?.excludeTitle||'').toLowerCase();
  const buildFallbackProject=()=>{
    // Avoid re-showing the same brief/angle as the last one the user saw.
    let angle=pick(projectAngles);
    let title=`${weakest} ${user.careerGoal||'portfolio'} challenge — ${angle.label}`;
    if(excludeTitle && projectAngles.length>1){
      let guard=0;
      while(title.toLowerCase()===excludeTitle && guard<10){angle=pick(projectAngles);title=`${weakest} ${user.careerGoal||'portfolio'} challenge — ${angle.label}`;guard++;}
    }
    return {title,difficulty:user.experienceLevel||'Intermediate',estimatedTime:pick(['4-6 hours','6-10 hours','8-12 hours']),goal:user.careerGoal||'your career goal',skills:[...(current?.skills||[]),weakest].filter((x,i,a)=>a.indexOf(x)===i).slice(0,6),brief:angle.brief(weakest,user.careerGoal||'your target role'),requirements:['Solve a real problem for the target role','Use skills from the current roadmap phase','Include validation, error handling and usable responsive UX','Write a README with setup, architecture and learning notes','Test the main user flow'],bonus:`Add one feature that specifically demonstrates ${weakest}.`};
  };
  // Compute the fallback project once so the AI path (when no key is
  // configured) and the merge below use the *same* randomized pick,
  // instead of two independent random calls stepping on each other.
  const base=buildFallbackProject();
  const result=await askAI('Generate one personalized portfolio project from the learner profile, current roadmap and weakest skill. Vary the angle/idea each time so repeated calls do not return the same project. Avoid the excluded title if one is given. Return JSON with title,difficulty,estimatedTime,goal,skills,brief,requirements and bonus. Never assume a fixed stack.',{profile:user,currentPhase:current,weakestSkill:weakest,excludeTitle:req.body?.excludeTitle||null},()=>base);
  res.json({...base,...result,skills:Array.isArray(result.skills)?result.skills:base.skills,requirements:Array.isArray(result.requirements)?result.requirements:base.requirements});
}

export async function review(req,res){const {user,path}=await getContext(req.user.id);const phases=path?.phases||[];const feedback=await Feedback.find({userId:req.user.id}).sort({createdAt:-1}).limit(20);const completed=phases.filter(p=>p.completed).length;res.json({headline:completed?`You completed ${completed} of ${phases.length} roadmap topics.`:'Your personalized learning journey is ready to start.',progress:path?.progress||0,strongest:(user?.skills||[]).slice().sort((a,b)=>b.level-a.level).slice(0,3),focus:(path?.skillGaps||[]).filter(g=>g.current<g.required).sort((a,b)=>(b.required-b.current)-(a.required-a.current)).slice(0,3),feedback:{easy:feedback.filter(f=>f.type==='easy').length,hard:feedback.filter(f=>f.type==='hard').length,total:feedback.length},insight:'Use assessment results, completed topics and feedback to choose the next highest-value skill.',next:phases.find(p=>p.status==='current')?.title||'Review your completed work'});}

export async function interview(req,res){const {user,path}=await getContext(req.user.id);const skills=[...(path?.skillGaps||[]).sort((a,b)=>(b.required-b.current)-(a.required-a.current)).map(x=>x.skill),...(path?.phases||[]).filter(p=>p.completed).flatMap(p=>p.skills||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,10);const fallback=()=>({role:user.careerGoal||'Target role',readiness:Math.round((path?.progress||0)*.7+(user.skills?.reduce((a,s)=>a+s.level,0)/(user.skills?.length||1))*.3),questions:skills.map((skill,i)=>({id:`i-${i+1}`,skill,question:`Explain ${skill} by solving a realistic problem related to ${user.careerGoal||'the target role'}.`,followUp:`What trade-offs, debugging steps or improvements would you consider?`}))});const result=await askAI('Generate a personalized mock interview from the learner goal, roadmap and skill gaps. Return role, readiness and 6-10 questions with id, skill, question and followUp. Do not assume a fixed stack.',{profile:user,path},fallback);res.json({...fallback(),...result,questions:Array.isArray(result.questions)?result.questions:fallback().questions});}
