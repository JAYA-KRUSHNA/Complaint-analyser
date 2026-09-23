/**
 * CiviSense AI — Firebase Configuration
 *
 * Initializes Firebase for Phone SMS OTP verification.
 * Uses environment variables for all config values.
 * Gracefully handles missing config (e.g., on deploy without Firebase env vars).
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn('[CiviSense] Firebase config missing — phone OTP disabled. Email OTP still works.');
  }
} catch (e) {
  console.warn('[CiviSense] Firebase init failed:', e);
}

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
