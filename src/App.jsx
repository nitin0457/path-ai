import {useEffect,useState} from 'react';
import {Navigate,Route,Routes,useLocation,useNavigate} from 'react-router-dom';
import Landing from './pages/Landing';
import {Login,Register,VerifyEmail} from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Assessment from './pages/Assessment';
import ProjectLab from './pages/ProjectLab';
import Review from './pages/Review';
import Interview from './pages/Interview';
import AppShell from './components/AppShell';
import {api} from './lib/api';

function Protected({children, learner}) {
  return learner ? children : <Navigate to="/login" replace />;
}

function OnboardingRoute({learner, path, setLearner, setPath}) {
  // If a roadmap already exists, onboarding has already been completed.
  return learner?.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Onboarding learner={learner} setLearner={setLearner} setPath={setPath}/>;
}

export default function App() {
  const [learner,setLearner] = useState(null);
  const [path,setPath] = useState(null);
  const [loading,setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const refresh = async () => {
    if (!localStorage.getItem('learnpath-token')) {
      setLoading(false);
      return null;
    }
    try {
      const [profile, learningPath] = await Promise.all([api.profile(), api.getPath()]);
      setLearner(profile);
      setPath(learningPath);
      return { profile, learningPath };
    } catch {
      localStorage.removeItem('learnpath-token');
      setLearner(null);
      setPath(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); const onUpdate=()=>refresh(); window.addEventListener('learnpath:path-updated',onUpdate); return ()=>window.removeEventListener('learnpath:path-updated',onUpdate); }, []);

  const authSuccess = async (result) => {
    localStorage.setItem('learnpath-token', result.token);
    const state = await refresh();

    // Existing users who already have a generated roadmap skip onboarding.
    // A newly registered user still needs onboarding before entering the app.
    navigate(state?.learningPath ? '/dashboard' : '/onboarding');
  };

  const logout = () => {
    localStorage.removeItem('learnpath-token');
    setLearner(null);
    setPath(null);
    navigate('/');
  };

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#070b16] text-slate-200">Loading LearnPath AI...</div>;

  const shell = ['/dashboard','/roadmap','/assistant','/profile','/assessment','/projects','/review','/interview'].includes(location.pathname);

  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login onSuccess={authSuccess}/>}/>
      <Route path="/register" element={<Register onSuccess={authSuccess}/>}/>
      <Route path="/verify-email" element={<VerifyEmail onSuccess={authSuccess}/>}/>
      <Route path="/onboarding" element={<Protected learner={learner}><OnboardingRoute learner={learner} path={path} setLearner={setLearner} setPath={setPath}/></Protected>}/>
      <Route path="/dashboard" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Dashboard learner={learner} path={path} setPath={setPath}/></AppShell></Protected>}/>
      <Route path="/roadmap" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Roadmap path={path} setPath={setPath}/></AppShell></Protected>}/>
      <Route path="/assistant" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Assistant learner={learner} path={path}/></AppShell></Protected>}/>
      <Route path="/profile" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Profile learner={learner} setLearner={setLearner} path={path}/></AppShell></Protected>}/>
      <Route path="/assessment" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Assessment/></AppShell></Protected>}/>
      <Route path="/projects" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><ProjectLab/></AppShell></Protected>}/>
      <Route path="/review" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Review/></AppShell></Protected>}/>
      <Route path="/interview" element={<Protected learner={learner}><AppShell learner={learner} onLogout={logout}><Interview/></AppShell></Protected>}/>
      <Route path="*" element={<Navigate to={shell && learner ? location.pathname : '/'} replace/>}/>
    </Routes>
  );
}
