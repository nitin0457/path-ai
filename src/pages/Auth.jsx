import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo, Button } from '../components/UI';
import { api } from '../lib/api';
import { firebaseAuth, firebaseConfigured, googleProvider } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  applyActionCode,
  reload,
  updateProfile,
} from 'firebase/auth';

function AuthCard({ title, subtitle, children }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#070b16] px-4 text-white"><div className="w-full max-w-md"><Logo/><div className="card mt-8 space-y-5 p-6 sm:p-8"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-sm muted">{subtitle}</p></div>{children}</div></div></div>;
}

function FirebaseNotice() {
  if (firebaseConfigured) return null;
  return <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">Firebase Authentication is not configured. Add the VITE_FIREBASE_* values to the frontend .env.</div>;
}

function Divider() { return <div className="flex items-center gap-3 text-xs muted"><div className="h-px flex-1 bg-white/10"/><span>OR</span><div className="h-px flex-1 bg-white/10"/></div>; }

function friendlyError(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email. Login using the original method first.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  };
  return map[code] || err?.message || 'Something went wrong. Please try again.';
}

async function syncFirebaseUser(user, requireVerified = true) {
  await reload(user);
  if (requireVerified && !user.emailVerified) {
    const error = new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    error.requiresVerification = true;
    error.email = user.email;
    throw error;
  }
  const idToken = await user.getIdToken(true);
  return api.firebase(idToken);
}

async function googleLogin() {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return syncFirebaseUser(result.user, false);
}

function GoogleButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const click = async () => {
    setLoading(true);
    try { await onSuccess(await googleLogin()); }
    catch (err) { onError(err); }
    finally { setLoading(false); }
  };
  return <Button type="button" variant="secondary" className="w-full" onClick={click} disabled={!firebaseConfigured || loading}><span className="flex items-center justify-center gap-3">{loading ? <><svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/><path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><span>Connecting to Google...</span></> : <><svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.08.31-1.58V7.89H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.11l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.43 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"/></svg><span>Continue with Google</span></>}</span></Button>;
}

export function Login({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [verifyEmail, setVerifyEmail] = useState(''); const [resending, setResending] = useState(false);
  const submit = async e => { e.preventDefault(); setError(''); setLoading(true); try { if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.'); const result = await signInWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password); const synced = await syncFirebaseUser(result.user, true); await onSuccess(synced); } catch (err) { setError(friendlyError(err)); if (err.requiresVerification) setVerifyEmail(err.email || form.email); } finally { setLoading(false); } };
  const resend = async () => { if (!firebaseAuth || !verifyEmail) return; setResending(true); setError(''); try { const result = await signInWithEmailAndPassword(firebaseAuth, verifyEmail.trim(), form.password); await sendEmailVerification(result.user, { url: `${window.location.origin}/verify-email`, handleCodeInApp: true }); setError('A new verification email has been sent.'); } catch (err) { setError(friendlyError(err)); } finally { setResending(false); } };
  return <AuthCard title="Welcome back" subtitle="Continue your personalized learning journey"><FirebaseNotice/><GoogleButton onSuccess={onSuccess} onError={err => setError(friendlyError(err))}/><Divider/><form onSubmit={submit} className="space-y-4"><label className="text-sm">Email<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-indigo-400"/></label><label className="text-sm">Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-indigo-400"/></label>{error&&<div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}{verifyEmail&&<button type="button" onClick={resend} disabled={resending} className="w-full text-left text-xs text-indigo-300 hover:text-indigo-200">{resending?'Sending...':'Resend verification email'}</button>}<Button className="w-full" disabled={loading || !firebaseConfigured}>{loading?'Signing in...':'Login'}</Button></form><p className="text-center text-sm muted">No account? <Link className="text-indigo-300" to="/register">Create one</Link></p></AuthCard>;
}

export function Register({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const [sentEmail, setSentEmail] = useState('');
  const submit = async e => { e.preventDefault(); setError(''); setLoading(true); try { if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.'); const result = await createUserWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password); if (form.name.trim()) await updateProfile(result.user, { displayName: form.name.trim() }); await sendEmailVerification(result.user, { url: `${window.location.origin}/verify-email`, handleCodeInApp: true }); setSent(true); setSentEmail(result.user.email); await signOut(firebaseAuth); } catch (err) { setError(friendlyError(err)); } finally { setLoading(false); } };
  const google = async result => { try { await onSuccess(result); } catch (err) { setError(friendlyError(err)); } };
  const resend = async () => { if (!firebaseAuth) return; setError(''); try { const result = await signInWithEmailAndPassword(firebaseAuth, sentEmail.trim(), form.password); await sendEmailVerification(result.user, { url: `${window.location.origin}/verify-email`, handleCodeInApp: true }); await signOut(firebaseAuth); setError('A new verification email has been sent.'); } catch (err) { setError(friendlyError(err)); } };
  if (sent) return <AuthCard title="Verify your email" subtitle="One last step before you start your learning journey"><div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5 text-sm"><p>We sent a verification link to <strong>{sentEmail}</strong>.</p><p className="mt-2 muted">Open your inbox and click the link. Firebase securely handles the verification for you.</p></div>{error&&<div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-sm text-indigo-200">{error}</div>}<button onClick={resend} className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-indigo-300 hover:bg-white/5">Resend verification email</button><p className="text-center text-sm muted">Already verified? <Link className="text-indigo-300" to="/login">Login</Link></p></AuthCard>;
  return <AuthCard title="Create your account" subtitle="Your personalized roadmap starts here"><FirebaseNotice/><GoogleButton onSuccess={google} onError={err => setError(friendlyError(err))}/><Divider/><form onSubmit={submit} className="space-y-4"><input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none"/><input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none"/><input required minLength="6" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none"/>{error&&<div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}<Button className="w-full" disabled={loading || !firebaseConfigured}>{loading?'Creating...':'Create account'}</Button></form><p className="text-center text-sm muted">Already have an account? <Link className="text-indigo-300" to="/login">Login</Link></p></AuthCard>;
}

export function VerifyEmail({ onSuccess }) {
  const location=useLocation(); const navigate=useNavigate(); const [status,setStatus]=useState('verifying'); const [message,setMessage]=useState('Verifying your email...');
  useEffect(()=>{let active=true; (async()=>{try{if(!firebaseAuth) throw new Error('Firebase Authentication is not configured.'); const params=new URLSearchParams(location.search); const mode=params.get('mode'); const oobCode=params.get('oobCode'); if (mode==='verifyEmail' && oobCode) await applyActionCode(firebaseAuth,oobCode); const user=firebaseAuth.currentUser; if(user){await reload(user); if(!user.emailVerified) throw new Error('Email verification is not complete yet. Please open the latest verification email.'); const result=await syncFirebaseUser(user,false); if(active){setStatus('success');setMessage('Email verified successfully.');await onSuccess(result);}} else if(active){setStatus('success');setMessage('Email verified successfully. You can now log in.');setTimeout(()=>navigate('/login'),1200);} }catch(err){if(active){setStatus('error');setMessage(friendlyError(err));}}})();return()=>{active=false;};},[location.search,onSuccess,navigate]);
  return <AuthCard title={status==='verifying'?'Verifying email':status==='success'?'Email verified':'Verification failed'} subtitle={message}>{status==='error'&&<Link to="/login" className="btn-primary block w-full text-center">Back to login</Link>}</AuthCard>;
}
