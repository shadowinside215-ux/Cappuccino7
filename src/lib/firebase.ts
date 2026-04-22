import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use the database ID from the config if available
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test with enhanced logging
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firebase connection failed: The client is offline. Check your internet connection.");
      } else if (error.message.includes('code=unavailable')) {
        console.error("Firebase connection failed: Backend is unavailable. This may be due to a transient networking issue or the Firestore API being disabled/provisioned.");
      } else {
        console.error("Firebase connection error:", error.message);
      }
    }
  }
}
testConnection();
