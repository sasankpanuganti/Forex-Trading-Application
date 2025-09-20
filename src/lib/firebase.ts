// Firebase initialization (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// NOTE: These values were provided by the user. In production, move to env.
const firebaseConfig = {
  apiKey: "AIzaSyACIJYgb2OjZ40UJ6qRs7zqGlGYEzTyQTA",
  authDomain: "forex-17102.firebaseapp.com",
  projectId: "forex-17102",
  storageBucket: "forex-17102.firebasestorage.app",
  messagingSenderId: "965319249427",
  appId: "1:965319249427:web:df106298012c714c3179e6",
  measurementId: "G-Q49H0H5B1H"
};

const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // analytics may fail in non-browser environments
}

const db = getFirestore(app);

export { app, analytics, db };
