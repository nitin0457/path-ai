# Firebase Authentication setup

LearnPathAI now uses **Firebase Authentication as the single authentication provider**. The custom SMTP/Nodemailer email-verification flow and direct Google token handling are no longer used.

## What is supported
- Email/password registration
- Firebase-hosted email verification
- Resend verification email
- Email/password login blocked until the email is verified
- Google sign-in/sign-up
- MongoDB profile synchronization through a verified Firebase ID token
- Existing LearnPathAI JWT remains in use for the protected API after Firebase authentication

## 1. Create/select the Firebase project
Open https://console.firebase.google.com/ and create/select your LearnPathAI project.

## 2. Enable sign-in methods
Firebase Console → Build → Authentication → Sign-in method:
- Enable **Email/Password**
- Enable **Google**

## 3. Add the web app
Firebase Console → Project settings → General → Your apps → Web (`</>`).
Copy these values into the root `.env`:

VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

Firebase web config values are client-side configuration; do not put a Firebase Admin service-account private key in the frontend.

## 4. Authorized domains
Firebase Console → Authentication → Settings → Authorized domains.
Make sure `localhost` is present for local development. Add your production domain when deploying.

## 5. Create a Firebase Admin service account key
Firebase Console → Project settings → Service accounts → Firebase Admin SDK → Generate new private key.

Use the JSON values in `backend/.env`:

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"

Never commit `backend/.env` or the downloaded service-account JSON to GitHub.

## 6. Install dependencies
From the project root:

npm install
npm --prefix backend install

## 7. Start the app
Terminal 1:
npm run dev:client

Terminal 2:
npm run dev:server

## Authentication flow
### Email
1. User creates an account with email/password.
2. Firebase sends the verification email.
3. User clicks the Firebase verification link.
4. Login is allowed only after Firebase reports `email_verified=true`.
5. Backend verifies the Firebase ID token and syncs the MongoDB user.

### Google
1. User clicks Continue with Google.
2. Firebase handles Google OAuth.
3. Backend verifies the Firebase ID token.
4. MongoDB user is created/updated and the normal LearnPathAI app JWT is issued.

No SMTP host, SMTP password, Nodemailer setup, or Google OAuth client secret is required for this implementation.
