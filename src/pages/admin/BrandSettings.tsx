import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, Save, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import OptimizedImage from '../../components/ui/OptimizedImage';

export default function BrandSettings() {
  const [logoUrl, setLogoUrl] = useState('https://raw.githubusercontent.com/Lucide-Icons/lucide/main/icons/coffee.svg');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [cartBgUrl, setCartBgUrl] = useState('');
  const [ordersBgUrl, setOrdersBgUrl] = useState('');
  const [profileBgUrl, setProfileBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [reviewPopupEnabled, setReviewPopupEnabled] = useState(true);
  const [reviewPopupFrequencyDays, setReviewPopupFrequencyDays] = useState(7);
  const [reviewPopupTitle, setReviewPopupTitle] = useState('Enjoying Cappuccino7?');
  const [reviewPopupSubtitle, setReviewPopupSubtitle] = useState('Your support helps us grow. Leave us a quick 5-star review on Google Maps.');
  const [googleMapsLink, setGoogleMapsLink] = useState('https://www.google.com/maps/search/?api=1&query=Cappuccino7+Salé+El+Jadida');
  const [reviewPopupStatsClicks, setReviewPopupStatsClicks] = useState(0);
  const [activeUpload, setActiveUpload] = useState<'logo' | 'hero' | 'cart' | 'orders' | 'profile' | 'login' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const cartFileInputRef = useRef<HTMLInputElement>(null);
  const ordersFileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const loginFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'brand'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLogoUrl(data.logoUrl || logoUrl);
          setHeroImageUrl(data.heroImageUrl || '');
          setCartBgUrl(data.cartBgUrl || '');
          setOrdersBgUrl(data.ordersBgUrl || '');
          setProfileBgUrl(data.profileBgUrl || '');
          setLoginBgUrl(data.loginBgUrl || '');
          setReviewPopupEnabled(data.reviewPopupEnabled ?? true);
          setReviewPopupFrequencyDays(data.reviewPopupFrequencyDays || 7);
          setReviewPopupTitle(data.reviewPopupTitle || 'Enjoying Cappuccino7?');
          setReviewPopupSubtitle(data.reviewPopupSubtitle || 'Your support helps us grow. Leave us a quick 5-star review on Google Maps.');
          setGoogleMapsLink(data.googleMapsLink || 'https://www.google.com/maps/search/?api=1&query=Cappuccino7+Salé+El+Jadida');
          setReviewPopupStatsClicks(data.reviewPopupStatsClicks || 0);
        }
      } catch (err) {
        console.error('Error fetching brand settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero' | 'cart' | 'orders' | 'profile' | 'login') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Max 5MB.');
      return;
    }

    const env = (import.meta as any).env;
    const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary config missing:", { cloudName, uploadPreset });
      toast.error('Cloudinary configuration missing. Please check .env');
      return;
    }

    setActiveUpload(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      if (data.secure_url) {
        if (type === 'logo') setLogoUrl(data.secure_url);
        else if (type === 'hero') setHeroImageUrl(data.secure_url);
        else if (type === 'cart') setCartBgUrl(data.secure_url);
        else if (type === 'orders') setOrdersBgUrl(data.secure_url);
        else if (type === 'profile') setProfileBgUrl(data.secure_url);
        else if (type === 'login') setLoginBgUrl(data.secure_url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('No secure URL returned');
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActiveUpload(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'brand'), {
        logoUrl,
        heroImageUrl,
        cartBgUrl,
        ordersBgUrl,
        profileBgUrl,
        loginBgUrl,
        reviewPopupEnabled,
        reviewPopupFrequencyDays: Number(reviewPopupFrequencyDays),
        reviewPopupTitle,
        reviewPopupSubtitle,
        googleMapsLink,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success('Brand settings saved!');
    } catch (err) {
      console.error('Error saving brand settings:', err);
      toast.error('Failed to save brand settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-bento-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="p-3 bg-stone-100 rounded-2xl text-stone-500 hover:text-bento-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 pl-1">Identity Management</p>
          <h1 className="text-4xl font-bold text-bento-primary">Brand Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon size={20} className="text-bento-primary" />
              App Logo
            </h2>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Brand Identity Logo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-white border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-bento-primary hover:bg-stone-50 transition-all group overflow-hidden relative"
              >
                {activeUpload === 'logo' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-bento-primary animate-spin" size={32} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Uploading via Cloudinary...</p>
                  </div>
                ) : logoUrl ? (
                  <>
                    <div className="w-40 h-40 rounded-2xl overflow-hidden border border-stone-100 shadow-sm p-4 bg-[#FDF8F3]">
                      <OptimizedImage 
                        src={logoUrl} 
                        className="w-full h-full object-contain" 
                        alt="Logo preview" 
                        showOverlay={false}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="text-white" size={32} />
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm text-stone-300 group-hover:text-bento-primary transition-colors">
                      <Upload size={32} />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center px-4">
                      Tap to upload app logo
                    </p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e, 'logo')}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="card space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon size={20} className="text-bento-primary" />
              Hero Background
            </h2>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Hero Section Photo</label>
              <div 
                onClick={() => heroFileInputRef.current?.click()}
                className="w-full aspect-video bg-white border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-bento-primary hover:bg-stone-50 transition-all group overflow-hidden relative"
              >
                {activeUpload === 'hero' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-bento-primary animate-spin" size={32} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Uploading via Cloudinary...</p>
                  </div>
                ) : heroImageUrl ? (
                  <>
                    <OptimizedImage 
                      src={heroImageUrl} 
                      className="w-full h-full object-cover" 
                      alt="Hero preview" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="text-white" size={32} />
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm text-stone-300 group-hover:text-bento-primary transition-colors">
                      <Upload size={32} />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center px-4">
                      Tap to upload hero background
                    </p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={heroFileInputRef}
                onChange={(e) => handleFileUpload(e, 'hero')}
                accept="image/*"
                className="hidden"
              />
              <input 
                type="text" 
                placeholder="Or paste direct Image URL here"
                value={heroImageUrl} 
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-[10px] focus:ring-2 focus:ring-bento-primary transition-all outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-stone-400" />
                Cart Page Background
              </h3>
              <div 
                onClick={() => cartFileInputRef.current?.click()}
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-bento-primary overflow-hidden relative group"
              >
                {activeUpload === 'cart' ? <Loader2 className="animate-spin text-bento-primary" /> : cartBgUrl ? (
                  <OptimizedImage 
                    src={cartBgUrl} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    alt="Cart Background"
                  />
                ) : <Upload className="text-stone-300" />}
                <input type="file" ref={cartFileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'cart')} accept="image/*" />
              </div>
              <input type="text" value={cartBgUrl} onChange={e => setCartBgUrl(e.target.value)} placeholder="Cart Image URL" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 text-[10px] outline-none" />
            </div>

            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-stone-400" />
                Orders Page Background
              </h3>
              <div 
                onClick={() => ordersFileInputRef.current?.click()}
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-bento-primary overflow-hidden relative group"
              >
                {activeUpload === 'orders' ? <Loader2 className="animate-spin text-bento-primary" /> : ordersBgUrl ? (
                  <OptimizedImage 
                    src={ordersBgUrl} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    alt="Orders Background"
                  />
                ) : <Upload className="text-stone-300" />}
                <input type="file" ref={ordersFileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'orders')} accept="image/*" />
              </div>
              <input type="text" value={ordersBgUrl} onChange={e => setOrdersBgUrl(e.target.value)} placeholder="Orders Image URL" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 text-[10px] outline-none" />
            </div>

            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-stone-400" />
                Profile Page Background
              </h3>
              <div 
                onClick={() => profileFileInputRef.current?.click()}
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-bento-primary overflow-hidden relative group"
              >
                {activeUpload === 'profile' ? <Loader2 className="animate-spin text-bento-primary" /> : profileBgUrl ? (
                  <OptimizedImage 
                    src={profileBgUrl} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    alt="Profile Background"
                  />
                ) : <Upload className="text-stone-300" />}
                <input type="file" ref={profileFileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'profile')} accept="image/*" />
              </div>
              <input type="text" value={profileBgUrl} onChange={e => setProfileBgUrl(e.target.value)} placeholder="Profile Image URL" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 text-[10px] outline-none" />
            </div>

            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-stone-400" />
                Login Page Background
              </h3>
              <div 
                onClick={() => loginFileInputRef.current?.click()}
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-bento-primary overflow-hidden relative group"
              >
                {activeUpload === 'login' ? <Loader2 className="animate-spin text-bento-primary" /> : loginBgUrl ? (
                  <OptimizedImage 
                    src={loginBgUrl} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    alt="Login Background"
                  />
                ) : <Upload className="text-stone-300" />}
                <input type="file" ref={loginFileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'login')} accept="image/*" />
              </div>
              <input type="text" value={loginBgUrl} onChange={e => setLoginBgUrl(e.target.value)} placeholder="Login Image URL" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 text-[10px] outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-4 py-4">
            <button 
              onClick={handleSave}
              disabled={isSaving || !!activeUpload}
              className="bg-bento-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>

          <div className="card space-y-8 bg-amber-50/30 dark:bg-amber-900/5 border-amber-100/50 dark:border-amber-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Star size={20} className="text-amber-600 fill-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Review Popup</h2>
                  <p className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400/60 uppercase tracking-widest">Google Maps Integration</p>
                </div>
              </div>
              <div 
                onClick={() => setReviewPopupEnabled(!reviewPopupEnabled)}
                className={`w-14 h-8 rounded-full transition-all cursor-pointer relative ${reviewPopupEnabled ? 'bg-amber-600' : 'bg-stone-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${reviewPopupEnabled ? 'left-7' : 'left-1'}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Popup Title</label>
                  <input 
                    type="text" 
                    value={reviewPopupTitle} 
                    onChange={e => setReviewPopupTitle(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl p-4 text-sm font-bold shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Popup Subtitle</label>
                  <textarea 
                    value={reviewPopupSubtitle} 
                    onChange={e => setReviewPopupSubtitle(e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl p-4 text-sm font-medium shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Google Maps Review Link</label>
                  <input 
                    type="text" 
                    value={googleMapsLink} 
                    onChange={e => setGoogleMapsLink(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl p-4 text-xs font-mono shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Frequency (Show every X days)</label>
                  <input 
                    type="number" 
                    value={reviewPopupFrequencyDays} 
                    onChange={e => setReviewPopupFrequencyDays(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl p-4 text-sm font-bold shadow-sm" 
                  />
                </div>

                <div className="p-6 bg-amber-100/50 dark:bg-amber-900/20 rounded-[2rem] border border-amber-200 dark:border-amber-900/30 flex flex-col items-center text-center">
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Total Review Clicks</p>
                  <p className="text-4xl font-black text-amber-950 dark:text-amber-100">{reviewPopupStatsClicks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card !bg-bento-primary !text-white p-8">
            <h3 className="text-xl font-bold mb-4">Preview</h3>
            <p className="text-white/70 text-sm mb-6">This is how your logo will appear in the app header and login screens.</p>
            
            <div className="space-y-8">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5">
                  <OptimizedImage 
                    src={logoUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain" 
                    showOverlay={false}
                  />
                </div>
                <span className="font-black italic uppercase tracking-tighter text-sm">Cappuccino7</span>
              </div>

              <div className="p-8 bg-white rounded-3xl shadow-lg flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md p-2 bg-white border border-stone-100">
                  <OptimizedImage 
                    src={logoUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain" 
                    showOverlay={false}
                  />
                </div>
                <div className="h-2 w-24 bg-stone-100 rounded-full" />
                <div className="h-10 w-full bg-bento-primary rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
