import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, Save, Coffee, Utensils, Croissant, Cake, Pizza, Cookie } from 'lucide-react';
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
      <div className="flex items-center justify-center p-12 min-h-[60vh]">
        <div className="relative">
          <Loader2 className="animate-spin text-bento-primary" size={48} />
          <Coffee className="absolute inset-0 m-auto text-amber-600/20" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => navigate('/admin')}
          className="p-3 bg-white shadow-sm border border-stone-100 rounded-2xl text-stone-500 hover:text-bento-primary hover:border-bento-primary/20 transition-all active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 bg-amber-100 rounded-md">
              <Pizza size={12} className="text-amber-600" />
            </span>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] pl-1">Identity Management</p>
          </div>
          <h1 className="text-4xl font-bold text-bento-primary">Brand Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        <div className="lg:col-span-2 space-y-8">
          <div className="card space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Utensils size={120} />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <ImageIcon size={20} className="text-amber-600" />
                </div>
                App Logo
              </h2>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                  <Cookie size={16} />
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                  <Cake size={16} />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Brand Identity Logo
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[21/9] bg-stone-50 border-2 border-dashed border-stone-200 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-bento-primary hover:bg-stone-100/50 transition-all group overflow-hidden relative shadow-inner"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="text-bento-primary animate-spin" size={48} />
                      <Coffee className="absolute inset-0 m-auto text-amber-600" size={20} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Optimizing via Cloudinary</p>
                      <p className="text-[9px] text-stone-400 mt-1">Please wait a moment...</p>
                    </div>
                  </div>
                ) : logoUrl ? (
                  <>
                    <div className="bg-white rounded-full p-6 shadow-xl border border-stone-100 group-hover:scale-105 transition-transform duration-500">
                      <img src={logoUrl} className="w-32 h-32 object-contain" alt="Logo preview" />
                    </div>
                    <div className="absolute inset-0 bg-bento-primary/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex flex-col items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <div className="p-4 bg-white rounded-2xl shadow-lg">
                          <Upload className="text-bento-primary" size={32} />
                        </div>
                        <p className="text-white text-[12px] font-black uppercase tracking-widest shadow-sm">Replace Logo Photo</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-white rounded-3xl shadow-sm text-stone-300 group-hover:text-bento-primary group-hover:shadow-md transition-all duration-300">
                      <Upload size={40} />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
                        Tap to upload app logo
                      </p>
                      <p className="text-[9px] text-stone-400 mt-2 uppercase tracking-wide">
                        PNG, JPG or SVG (Max 5MB)
                      </p>
                    </div>
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

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Direct Source</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-bento-primary transition-colors">
                  <Utensils size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Paste direct Image URL here..."
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl pl-12 pr-5 py-4 text-sm focus:ring-2 focus:ring-bento-primary/20 focus:bg-white transition-all outline-none font-medium text-stone-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-stone-50 p-6 rounded-[32px] border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Coffee size={18} className="text-amber-700" />
              </div>
              <p className="text-xs text-stone-500 font-medium">Any changes made here will reflect globally across the app.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="bg-bento-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none min-w-[180px] justify-center"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Brand Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card !bg-bento-primary !text-white p-8 relative overflow-hidden group">
            {/* Background design elements */}
            <div className="absolute -bottom-10 -right-10 text-white/5 rotate-12 transition-transform group-hover:scale-110 duration-700">
              <Coffee size={180} />
            </div>
            <div className="absolute top-10 left-10 text-white/5 -rotate-12">
              <Pizza size={60} />
            </div>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Live Preview
            </h3>
            <p className="text-white/60 text-xs mb-8 leading-relaxed">Instantly visualize how your new logo looks in different sections of the app.</p>
            
            <div className="space-y-10 relative">
              {/* Header Preview */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1 underline decoration-white/20 underline-offset-4">App Header Style</p>
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-1 shadow-inner border border-white/20">
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black italic uppercase tracking-tighter text-sm tracking-widest">Cappuccino7</span>
                </div>
              </div>

              {/* Login Preview */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1 underline decoration-white/20 underline-offset-4">Login Screen Style</p>
                <div className="p-10 bg-white rounded-[40px] shadow-2xl flex flex-col items-center gap-6 border border-white/20">
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl p-2 bg-white border-4 border-stone-50 transition-transform group-hover:rotate-6 duration-500">
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="h-3 w-3/4 mx-auto bg-stone-100 rounded-full" />
                    <div className="h-2 w-1/2 mx-auto bg-stone-50 rounded-full" />
                    <div className="h-12 w-full bg-bento-primary rounded-2xl mt-4 flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">App Button</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-400/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-400/20">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-amber-400 rounded-lg text-bento-primary">
                    <Utensils size={14} />
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                    Pro Tip: Use a high-quality transparent PNG for the best visual experience across all app themes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-stone-50 border-stone-100 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-stone-400 group-hover:text-amber-600 transition-colors">
                <Coffee size={20} />
              </div>
              <span className="text-[8px] font-bold text-stone-400 uppercase">Drink</span>
            </div>
            <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-stone-400 group-hover:text-amber-600 transition-colors">
                <Pizza size={20} />
              </div>
              <span className="text-[8px] font-bold text-stone-400 uppercase">Food</span>
            </div>
            <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-stone-400 group-hover:text-amber-600 transition-colors">
                <Cake size={20} />
              </div>
              <span className="text-[8px] font-bold text-stone-400 uppercase">Dessert</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
