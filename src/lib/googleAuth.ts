import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential, signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function signInWithGoogleAndroidAndWeb(): Promise<UserCredential> {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Sign in natively with Google (uses device account UI)
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      // 2. Wrap the idToken in a Firebase JS SDK credential
      if (!result.credential?.idToken) {
        throw new Error('No ID token from Google Sign In');
      }
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      
      // 3. Sign into Firebase JS SDK with the native credential
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential;
    } catch (e: any) {
      console.error('Native Google Auth Error:', e);
      // Fallback or re-throw
      throw e;
    }
  } else {
    // Standard web popup fallback
    return signInWithPopup(auth, googleProvider);
  }
}
