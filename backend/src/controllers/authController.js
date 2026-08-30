import User from '../models/User.js';
import { env } from '../config/env.js';
import { signToken } from '../utils/token.js';
import { getFirebaseAdminAuth } from '../config/firebaseAdmin.js';

function publicUser(user) {
  return { id:user._id, name:user.name, email:user.email, emailVerified:user.emailVerified, authProvider:user.authProvider };
}

export async function firebaseAuth(req,res){
  try {
    const adminAuth=getFirebaseAdminAuth();
    if(!adminAuth) return res.status(503).json({message:'Firebase server authentication is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to backend/.env.'});
    const idToken=String(req.body?.idToken||'');
    if(!idToken) return res.status(400).json({message:'Firebase ID token is required'});
    const decoded=await adminAuth.verifyIdToken(idToken);
    const email=String(decoded.email||'').trim().toLowerCase();
    if(!email) return res.status(401).json({message:'Firebase account email is unavailable'});
    const provider=decoded.firebase?.sign_in_provider==='google.com'?'google':'email';
    if(provider==='email' && decoded.email_verified!==true && !req.body?.syncOnly) return res.status(403).json({message:'Please verify your email before logging in.',requiresVerification:true,email});
    let user=await User.findOne({$or:[{firebaseUid:decoded.uid},{email}]});
    if(!user) user=await User.create({name:String(req.body?.name||decoded.name||email.split('@')[0]).trim(),email,firebaseUid:decoded.uid,googleId:provider==='google'?(decoded.firebase?.identities?.['google.com']?.[0]||null):null,authProvider:provider,emailVerified:decoded.email_verified===true});
    else {
      user.firebaseUid=decoded.uid;
      if(provider==='google') user.googleId=decoded.firebase?.identities?.['google.com']?.[0]||user.googleId;
      if(req.body?.name && !user.name) user.name=String(req.body.name).trim();
      user.authProvider=provider;
      user.emailVerified=decoded.email_verified===true;
      await user.save();
    }
    res.json({token:signToken(user._id),user:publicUser(user)});
  } catch(e) {
    console.error('Firebase auth error:',e.message);
    res.status(401).json({message:'Firebase authentication failed. Please try again.'});
  }
}

// Legacy endpoints intentionally remain disabled so authentication has one source of truth: Firebase.
export async function register(req,res){ return res.status(410).json({message:'Email registration is handled by Firebase Authentication. Please use the updated client.'}); }
export async function login(req,res){ return res.status(410).json({message:'Email login is handled by Firebase Authentication. Please use the updated client.'}); }
export async function verifyEmail(req,res){ return res.status(410).json({message:'Email verification is handled by Firebase Authentication.'}); }
export async function resendVerification(req,res){ return res.status(410).json({message:'Email verification is handled by Firebase Authentication.'}); }
export async function googleAuth(req,res){ return res.status(410).json({message:'Google authentication is handled by Firebase Authentication.'}); }
