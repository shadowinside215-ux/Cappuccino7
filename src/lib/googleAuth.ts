import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential, signInWithPopup, signInWithRedirect, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function signInWithGoogleAndroidAndWeb(): Promise<UserCredential | void> {
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
      throw e;
    }
  } else {
    // Check if we are in an Android or mobile environment that might wrap the app in a WebView/TWA
    const isAndroidMobile = /Android/i.test(navigator.userAgent);
    if (isAndroidMobile) {
       // signInWithPopup notoriously breaks in Android WebViews/TWAs yielding "The requested action is invalid"
       // due to lost window.opener context cross-origin. Use redirect instead.
       return signInWithRedirect(auth, googleProvider);
    } else {
       // Standard web popup fallback
       return signInWithPopup(auth, googleProvider);
    }
  }
}

