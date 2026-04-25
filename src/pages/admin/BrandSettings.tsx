import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function BrandSettings() {
  const [logoUrl, setLogoUrl] = useState('https://firebasestorage.googleapis.com/v0/b/cappuccino7-app.appspot.com/o/assets%2Flogo_cappuccino.jpg?alt=media');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'brand'));
        if (settingsDoc.exists()) {
          setLogoUrl(settingsDoc.data().logoUrl);
        }
      } catch (err) {
        console.error('Error fetching brand settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
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
        setLogoUrl(data.secure_url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('No secure URL returned');
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'brand'), {
        logoUrl,
        updatedAt: new Date().toISOString()
      });
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
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-bento-primary hover:bg-stone-100 transition-all group overflow-hidden relative"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-bento-primary animate-spin" size={32} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Uploading via Cloudinary...</p>
                  </div>
                ) : logoUrl ? (
                  <>
                    <img src={logoUrl} className="w-full h-full object-contain p-8" alt="Logo preview" />
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
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Or URL</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>
              <input 
                type="text" 
                placeholder="Paste direct Image URL here"
                value={logoUrl} 
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-[10px] focus:ring-2 focus:ring-bento-primary transition-all outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="bg-bento-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card !bg-bento-primary !text-white p-8">
            <h3 className="text-xl font-bold mb-4">Preview</h3>
            <p className="text-white/70 text-sm mb-6">This is how your logo will appear in the app header and login screens.</p>
            
            <div className="space-y-8">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5">
                  <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <span className="font-black italic uppercase tracking-tighter text-sm">Cappuccino7</span>
              </div>

              <div className="p-8 bg-white rounded-3xl shadow-lg flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[20px] overflow-hidden shadow-md p-1 bg-white border border-stone-100">
                  <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
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
