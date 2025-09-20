import { db } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export async function saveDemoUserToFirestore(user: any) {
  try {
    // Use email as document id if available
    const id = user.email ? user.email.replace(/[^a-zA-Z0-9_.-]/g, '_') : `user_${Date.now()}`;
    const ref = doc(collection(db, 'demo_users'), id);
    await setDoc(ref, { ...user, createdAt: new Date().toISOString() });
    return { ok: true, id };
  } catch (err) {
    console.warn('firestore save failed', err);
    return { ok: false, error: String(err) };
  }
}
