# Firebase Authentication setup

This project now uses Firebase Authentication as the single authentication provider for:
- Email/password registration and login
- Email verification and resend verification
- Google sign-in/sign-up

No SMTP/Nodemailer configuration is required.

## 1. Create Firebase project
Open Firebase Console: https://console.firebase.google.com/
Create/select your LearnPathAI project.

## 2. Enable Authentication
Firebase Console → Build → Authentication → Get started → Sign-in method.
Enable:
- Email/Password
- Google

For Email/Password, keep Email link disabled unless you specifically want passwordless login.

## 3. Add the web app
Project settings → General → Your apps → Web (`</>`).
Register the app and copy its Firebase config values into the root `.env`:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

Keep VITE_API_URL=http://localhost:5000/api.

## 4. Authorized domain
Authentication → Settings → Authorized domains.
For local development, add:
- localhost

For production, add your real HTTPS domain.

## 5. Backend Admin SDK credentials
Firebase Console → Project settings → Service accounts → Firebase Admin SDK → Generate new private key.
Download the JSON and use its values in `backend/.env`:

FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"

Never commit the service-account JSON or `backend/.env` to GitHub.

## 6. Install dependencies
From the project root:

npm install
npm --prefix backend install

## 7. Start
Terminal 1:
npm run dev:client

Terminal 2:
npm run dev:server

Or use the existing concurrent dev command if configured.

## Authentication flow
1. Email registration creates the account in Firebase.
2. Firebase sends the verification email automatically.
3. Until verified, email/password login is blocked.
4. Google sign-in works through Firebase popup and Google accounts are treated as verified by Firebase.
5. The backend verifies the Firebase ID token with Firebase Admin SDK and synchronizes the MongoDB user profile.
6. LearnPathAI still issues its existing app JWT for the rest of the API, so the rest of the application does not need to be rewritten.
