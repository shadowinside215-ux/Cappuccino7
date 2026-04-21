import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // Create initial profile
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'Friend',
          email: user.email,
          points: 0,
          isAdmin: false,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Welcome to Caffeino!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8 p-6 bg-brown-600 text-white rounded-full">
        <Coffee size={64} />
      </div>
      <h1 className="text-4xl font-bold mb-4 text-brown-950">Welcome to Caffeino</h1>
      <p className="text-gray-600 mb-12 max-w-xs">
        Join our loyalty program and order your favorite coffee in just a few taps.
      </p>
      
      <button
        onClick={handleLogin}
        className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 px-6 rounded-xl shadow-sm hover:bg-gray-50 transition-colors font-medium"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        Sign in with Google
      </button>
    </div>
  );
}
