import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface BrandSettings {
  logoUrl: string;
  heroImageUrl?: string;
  cartBgUrl?: string;
  ordersBgUrl?: string;
  profileBgUrl?: string;
  loginBgUrl?: string;
  updatedAt?: string;
}

const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=200';
const DEFAULT_HERO = 'https://images.unsplash.com/photo-1501339819358-ee5f8babc4c1?q=80&w=1600';

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>({
    logoUrl: DEFAULT_LOGO,
    heroImageUrl: undefined,
    loginBgUrl: undefined
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
