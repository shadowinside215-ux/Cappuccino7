import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface BrandSettings {
  logoUrl: string;
  updatedAt?: string;
}

const DEFAULT_LOGO = 'https://firebasestorage.googleapis.com/v0/b/cappuccino7-app.appspot.com/o/assets%2Flogo_cappuccino.jpg?alt=media';

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>({
    logoUrl: DEFAULT_LOGO
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'brand'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as BrandSettings);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error listening to brand settings:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { settings, loading };
}
