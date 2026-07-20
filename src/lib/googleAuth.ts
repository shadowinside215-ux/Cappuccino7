import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential, signInWithPopup, signInWithRedirect, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from './firebase';


function confirmLogout(): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    
    const modal = document.createElement('div');
    modal.className = 'bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-stone-200 dark:border-stone-800';
    
    modal.innerHTML = `
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </div>
      <h3 class="text-xl font-black uppercase italic tracking-tighter text-stone-900 dark:text-white mb-2">Log Out</h3>
      <p class="text-sm font-medium text-stone-500 mb-8">Are you sure you want to sign out of your account?</p>
      <div class="flex gap-3 w-full">
        <button id="cancel-logout" class="flex-1 py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-black uppercase text-xs tracking-widest transition-colors">Cancel</button>
        <button id="confirm-logout" class="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all">Yes</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    document.getElementById('cancel-logout')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
    
    document.getElementById('confirm-logout')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });
  });
}

export async function signOutApp(): Promise<void> {
  const confirmed = await confirmLogout();
  if (!confirmed) {
    return Promise.reject('User cancelled logout');
  }
  try {
    await auth.signOut();
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut().catch(e => console.warn('Native sign out error', e));
    }
  } catch (error) {
    console.error('Sign out error', error);
  }
}

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
      
      // 3. Sign into Firebase JS SDK with the native credential with retry logic
      // This helps mitigate transient token validation delays (e.g. time skew, network blips)
      let userCredential;
      let retries = 3;
      while (retries > 0) {
        try {
          userCredential = await signInWithCredential(auth, credential);
          break;
        } catch (err: any) {
          retries--;
          if (retries === 0) throw err;
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return userCredential;
    } catch (e: any) {
      console.error('Native Google Auth Error:', e);
      throw e;
    }
  } else {
    // Standard web popup fallback works better for most environments than Redirect
    return signInWithPopup(auth, googleProvider);
  }
}

