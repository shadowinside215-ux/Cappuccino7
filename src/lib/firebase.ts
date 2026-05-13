import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = initializeFirestore(app, {
  // experimentalForceLongPolling: true // Removed for better stability unless specifically needed
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Enhanced Error Handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  AUTH = 'auth'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Global console protection for production
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.warn = noop;
  console.info = noop;
  console.error = noop; 
}

export function handleAuthError(error: any) {
  if (import.meta.env.DEV) {
    console.error('Auth Error:', error);
  }
  
  if (error.code === 'auth/network-request-failed') {
    return 'Network connection lost. Please check your internet and try again.';
  }
  if (error.code === 'auth/popup-blocked') {
    return 'Login window was blocked by your browser. Please allow popups.';
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
  }
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
    return 'Invalid email or password. If you are a staff member, please use your station ID and security key.';
  }
  
  if (import.meta.env.PROD) {
    return 'Authentication failed. Please check your credentials and try again.';
  }
  return error.message || 'Authentication failed. Please try again.';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }

  if (import.meta.env.DEV) {
    console.error('Firestore Error Details: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // In production, we log a generic message to console (if it's not silenced)
    // and throw a clean, non-technical error that the UI can catch or show.
    const genericMessage = 'A database error occurred. Please try again or contact support if the issue persists.';
    throw new Error(genericMessage);
  }
}

// Connection test with conditional logging
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    if (import.meta.env.DEV) {
      console.log("Firebase connection established successfully.");
    }
  } catch (error) {
    if (import.meta.env.DEV && error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firebase connection failed: The client is offline.");
      } else {
        console.error("Firebase connection error:", error.message);
      }
    }
  }
}
testConnection();
