import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { Plus, Trash2, Edit2, X, Check, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    isAvailable: true
  });

  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    const unsubProd = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    return () => { unsubCat(); unsubProd(); };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const env = (import.meta as any).env;
    const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
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
      const data = await response.json();
      if (data.secure_url) {
        setNewItem(prev => ({ ...prev, image: data.secure_url }));
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.categoryId) {
      toast.error('Please select a category');
      return;
    }
    try {
      await addDoc(collection(db, 'products'), newItem);
      setIsAdding(false);
      setNewItem({ name: '', description: '', price: 0, categoryId: '', image: '', isAvailable: true });
      toast.success('Product added successfully!');
    } catch (err) { toast.error('Failed to add product'); }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable });
      toast.success(product.isAvailable ? 'Item hidden' : 'Item visible');
    } catch (err) { toast.error('Update failed'); }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try { 
        await deleteDoc(doc(db, 'products', id)); 
        toast.success('Product removed'); 
      }
      catch (err) { toast.error('Delete failed'); }
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 pl-1">Menu Management</p>
          <h1 className="text-4xl font-bold text-bento-primary tracking-tight">Designer</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-bento-primary text-white p-4 rounded-2xl flex items-center gap-2 hover:bg-bento-ink transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> <span className="font-bold uppercase tracking-widest text-xs">Add Item</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="card !p-8 animate-in fade-in slide-in-from-top-4 space-y-6 bg-white border-2 border-bento-accent/10 shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-bento-primary">New Beverage or Dish</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={24} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 flex flex-col">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Basic Info</label>
                <input 
                  type="text" placeholder="Product Name" required 
                  value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 focus:ring-2 focus:ring-bento-accent transition-all outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <input 
                    type="number" step="0.01" placeholder="Price (MAD)" required
                    value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 focus:ring-2 focus:ring-bento-accent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <select 
                    required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 focus:ring-2 focus:ring-bento-accent transition-all outline-none appearance-none font-medium"
                  >
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <textarea 
                  placeholder="Detailed description (ingredients, special features...)"
                  value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 h-24 focus:ring-2 focus:ring-bento-accent transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Visual Representation</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-bento-accent hover:bg-stone-100 transition-all group overflow-hidden relative"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-bento-accent animate-spin" size={32} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Uploading to Cloudinary...</p>
                  </div>
                ) : newItem.image ? (
                  <>
                    <img src={newItem.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm text-stone-300 group-hover:text-bento-accent transition-colors">
                      <Upload size={32} />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center px-4">
                      Tap to upload photo from explorer
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
              <input 
                type="text" placeholder="Or paste Image URL manually"
                value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-bento-accent transition-all outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-bento-primary text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-bento-primary/20 hover:bg-bento-ink transition-all active:scale-[0.98]"
          >
            Publish to Digital Menu
          </button>
        </form>
      )}

      <div className="space-y-12">
        {categories.map(cat => {
          const catProducts = products.filter(p => p.categoryId === cat.id);
          if (catProducts.length === 0 && !isAdding) return null;

          return (
            <section key={cat.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-stone-300 uppercase tracking-[0.4em] whitespace-nowrap">{cat.name}</h2>
                <div className="h-px bg-stone-100 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catProducts.map(product => (
                  <div key={product.id} className="card group !p-4 flex items-center gap-5 hover:border-bento-accent/20">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img 
                        src={product.image || 'https://picsum.photos/seed/coffee/200/200'} 
                        className={`w-full h-full object-cover rounded-2xl shadow-sm ${!product.isAvailable && 'grayscale opacity-40'}`}
                        referrerPolicy="no-referrer"
                      />
                      {!product.isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-stone-800 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Hidden</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-bento-ink truncate leading-tight">{product.name}</h3>
                      <p className="text-xs font-black text-bento-accent mt-1">{product.price.toFixed(2)} MAD</p>
                      <p className="text-[10px] text-stone-400 truncate mt-1">{product.description || 'No description provided'}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => toggleAvailability(product)}
                        className={`p-2 rounded-xl transition-all ${product.isAvailable ? 'text-green-600 bg-green-50 shadow-sm shadow-green-100' : 'text-stone-300 bg-stone-50'}`}
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
