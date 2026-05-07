import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { Plus, Trash2, Edit2, X, Check, Upload, Image as ImageIcon, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import OptimizedImage from '../../components/ui/OptimizedImage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminMenu() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null); // null, 'new', or productId
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    subSection: '',
    image: '',
    isAvailable: true
  });
  const [editItem, setEditItem] = useState<Partial<Product>>({});
  const [editCategory, setEditCategory] = useState<Partial<Category>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated in Firebase
    const checkAuth = () => {
      const user = auth.currentUser;
      const isAdminEmail = user?.email?.toLowerCase() === 'dragonballsam86@gmail.com';
      
      if (!user) {
        toast.error('You are not signed into Firebase. Please log in on the main site first.', { id: 'auth-warning' });
      } else if (!isAdminEmail && !sessionStorage.getItem('admin_mode')) {
        toast.error('Your current Firebase account does not have admin permissions.', { id: 'admin-warning' });
      }
    };
    
    checkAuth();
    
    const unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => {
      console.error("Admin menu categories listener error:", error);
    });
    const unsubProd = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => {
      console.error("Admin menu products listener error:", error);
    });
    return () => { unsubCat(); unsubProd(); };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., 5MB limit)
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

    let uploadId: string | null = null;
    if (type === 'new') uploadId = 'new';
    else if (type === 'edit') uploadId = editingId;

    setIsUploading(uploadId);
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
        if (type === 'new') {
          setNewItem(prev => ({ ...prev, image: data.secure_url }));
        } else if (type === 'edit') {
          setEditItem(prev => ({ ...prev, image: data.secure_url }));
        }
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('No secure URL returned');
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(null);
    }
  };

  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editItem.name) {
      toast.error('Product name is required');
      return;
    }

    // Validate price
    const finalPrice = typeof editItem.price === 'string' ? parseFloat(editItem.price) : editItem.price;
    if (isNaN(finalPrice as number) || (finalPrice as number) < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      // Remove id and potential undefined fields
      const { id, ...updateData } = editItem as any;
      // Filter out any metadata or internal fields if any
      const cleanData = Object.keys(updateData).reduce((acc: any, key) => {
        if (updateData[key] !== undefined) {
          acc[key] = updateData[key];
        }
        return acc;
      }, {});

      // Ensure price is a number
      cleanData.price = finalPrice;

      await updateDoc(doc(db, 'products', editingId), cleanData);
      setEditingId(null);
      setEditItem({});
      toast.success('Product updated successfully!');
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, `products/${editingId}`);
    }
  };

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editCategory.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const { id, ...updateData } = editCategory as any;
      const cleanData = Object.keys(updateData).reduce((acc: any, key) => {
        if (updateData[key] !== undefined) {
          acc[key] = updateData[key];
        }
        return acc;
      }, {});

      await updateDoc(doc(db, 'categories', editingCategoryId), cleanData);
      setEditingCategoryId(null);
      setEditCategory({});
      toast.success('Category updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCategoryId}`);
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
      setNewItem({ name: '', description: '', price: 0, categoryId: '', subSection: '', image: '', isAvailable: true });
      toast.success('Product added successfully!');
    } catch (err) { 
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable });
      toast.success(product.isAvailable ? 'Item hidden' : 'Item visible');
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try { 
      await deleteDoc(doc(db, 'products', id)); 
      toast.success('Product removed');
      setConfirmDeleteId(null);
    }
    catch (err) { 
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete all products in this category
      const catProducts = products.filter(p => p.categoryId === categoryId);
      catProducts.forEach(product => {
        batch.delete(doc(db, 'products', product.id));
      });
      
      // 2. Delete the category itself
      batch.delete(doc(db, 'categories', categoryId));
      
      await batch.commit();
      toast.success(`Category "${categoryName}" and its ${catProducts.length} items deleted`);
      setConfirmDeleteCatId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
  };

  const getSubSectionLabel = (sub: string) => {
    return t(`sections.${sub}`, sub.replace('_', ' ').toUpperCase());
  };

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-500 hover:text-bento-primary transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 pl-1">Menu Management</p>
            <h1 className="text-4xl font-bold text-bento-primary tracking-tight">Designer</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              sessionStorage.removeItem('admin_mode');
              if (auth.currentUser?.email?.toLowerCase() !== 'dragonballsam86@gmail.com') {
                navigate('/admin/login');
              } else {
                navigate('/admin');
              }
              toast.success('Exited designer view');
            }}
            className="bg-stone-50 dark:bg-stone-900 text-stone-400 p-4 rounded-2xl flex items-center gap-2 hover:text-red-500 transition-all border border-stone-100 dark:border-white/5 shadow-sm active:scale-95"
            title="Log out of Section"
          >
            <LogOut size={20} /> <span className="font-bold uppercase tracking-widest text-[10px]">Exit Section</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-bento-primary text-white p-4 rounded-2xl flex items-center gap-2 hover:bg-bento-ink transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> <span className="font-bold uppercase tracking-widest text-xs">Add Item</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="card !p-8 animate-in fade-in slide-in-from-top-4 space-y-6 !bg-[#FDF8F3] border-2 border-bento-accent/10 shadow-2xl">
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
                    type="number" step="0.01" placeholder="Price (DH)" required
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

              {newItem.categoryId === 'crepes-desserts' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Subsection</label>
                  <select 
                    value={newItem.subSection} onChange={e => setNewItem({...newItem, subSection: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 focus:ring-2 focus:ring-bento-accent transition-all outline-none appearance-none font-medium"
                  >
                    <option value="">No Subsection</option>
                    <option value="crepes_salees">🌯 CRÊPES SALÉES</option>
                    <option value="crepes_sucrees">🍫 CRÊPES SUCRÉES</option>
                    <option value="gaufres">🧇 GAUFRES</option>
                    <option value="pancakes">🥞 PANCAKES</option>
                  </select>
                </div>
              )}

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
                {isUploading === 'new' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-bento-accent animate-spin" size={32} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Uploading to Cloudinary...</p>
                  </div>
                ) : newItem.image ? (
                  <>
                    {newItem.image && (
                      <OptimizedImage 
                        src={newItem.image} 
                        className="w-full h-full object-cover" 
                        alt="Product preview"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-[#FDF8F3] rounded-full shadow-sm text-stone-300 group-hover:text-bento-accent transition-colors">
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
                onChange={(e) => handleFileUpload(e, 'new')}
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
          return (
            <section key={cat.id} className="space-y-6">
              <div className="flex items-center gap-4 group/cat">
                <h2 className="text-sm font-black text-stone-300 uppercase tracking-[0.4em] whitespace-nowrap pl-1">{cat.name}</h2>
                <div className="h-px bg-stone-100 w-full" />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingCategoryId(cat.id);
                      setEditCategory(cat);
                    }}
                    className="p-2 text-stone-300 hover:text-bento-primary transition-all"
                    title="Edit category"
                  >
                    <Edit2 size={16} />
                  </button>
                  {confirmDeleteCatId === cat.id ? (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                      <button 
                        onClick={() => deleteCategory(cat.id, cat.name)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm"
                      >
                        Confirm Delete Category
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteCatId(null)}
                        className="bg-stone-200 text-stone-500 p-1 rounded-lg hover:bg-stone-300 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteCatId(cat.id)}
                      className="opacity-0 group-hover/cat:opacity-100 p-2 text-stone-300 hover:text-red-400 transition-all"
                      title="Delete entire category"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {editingCategoryId === cat.id && (
                <form onSubmit={handleUpdateCategory} className="card !p-6 border-bento-accent/30 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-bento-accent uppercase tracking-widest">Editing Category: {cat.name}</p>
                    <button type="button" onClick={() => setEditingCategoryId(null)} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={18} /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Category Properties</label>
                        <input 
                          type="text" placeholder="Category Name" required 
                          value={editCategory.name} onChange={e => setEditCategory({...editCategory, name: e.target.value})}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-bento-accent outline-none font-bold"
                        />
                      </div>
                      <button type="submit" className="w-full bg-bento-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-bento-primary/10 hover:bg-stone-900 transition-all">
                        Update Category
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(
                  catProducts.reduce((acc: any, p) => {
                    const sub = p.subSection || 'standard';
                    if (!acc[sub]) acc[sub] = [];
                    acc[sub].push(p);
                    return acc;
                  }, {})
                ).map(([sub, subProducts]: [string, any]) => (
                  <React.Fragment key={sub}>
                    {sub !== 'standard' && (
                      <div className="col-span-full pt-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-stone-100 dark:bg-stone-800 text-stone-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-stone-100 dark:border-white/5">
                            {getSubSectionLabel(sub)}
                          </span>
                          <div className="h-px bg-stone-100 flex-1" />
                        </div>
                      </div>
                    )}
                    {subProducts.map((product: Product) => (
                      <div key={product.id} className="flex flex-col gap-4">
                        <div className="card group !p-4 flex items-center gap-5 hover:border-bento-accent/20 !bg-[#FDF8F3]">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <OptimizedImage 
                              src={product.image || 'https://picsum.photos/seed/coffee/200/200'} 
                              className={`w-full h-full object-cover rounded-2xl shadow-sm ${!product.isAvailable && 'grayscale opacity-40'}`}
                              referrerPolicy="no-referrer"
                              alt={product.name}
                              showOverlay={false}
                              containerClassName="w-full h-full"
                            />
                            {!product.isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-stone-800 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Hidden</div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              {product.subSection && (
                                <span className="text-[8px] font-black text-bento-accent bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                  {product.subSection.replace('crepes_', '')}
                                </span>
                              )}
                              <h3 className="font-bold text-bento-ink truncate leading-tight">{product.name}</h3>
                            </div>
                            <p className="text-xs font-black text-bento-accent mt-1">{product.price} DH</p>
                            <p className="text-[10px] text-stone-400 truncate mt-1">{product.description || 'No description provided'}</p>
                          </div>
                            <div className="flex flex-col gap-2 relative">
                              <button 
                                onClick={() => {
                                  setEditingId(product.id);
                                  setEditItem(product);
                                }}
                                className="p-2 rounded-xl text-stone-400 bg-stone-50 hover:bg-stone-100 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => toggleAvailability(product)}
                                className={`p-2 rounded-xl transition-all ${product.isAvailable ? 'text-green-600 bg-green-50 shadow-sm shadow-green-100' : 'text-stone-300 bg-stone-50'}`}
                              >
                                <Check size={18} />
                              </button>
                              
                              {confirmDeleteId === product.id ? (
                                <div className="absolute right-0 bottom-0 flex flex-col gap-1 z-10">
                                  <button 
                                    onClick={() => deleteProduct(product.id)}
                                    className="p-2 rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-lg animate-in fade-in zoom-in"
                                    title="Confirm Delete"
                                  >
                                    <Trash2 size={18} />
                                    <span className="text-[6px] font-black uppercase tracking-widest block">DEL?</span>
                                  </button>
                                  <button 
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-1 rounded-lg text-stone-500 bg-stone-200 hover:bg-stone-300"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                        </div>

                        {editingId === product.id && (
                          <form onSubmit={handleUpdateItem} className="card !p-6 border-bento-accent/30 animate-in zoom-in-95 duration-200 !bg-[#FDF8F3]">
                            <div className="flex justify-between items-center mb-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-bento-accent uppercase tracking-widest">Editing Product</p>
                                <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                                  {cat.name} {product.subSection ? `> ${getSubSectionLabel(product.subSection)}` : ''}
                                </p>
                              </div>
                              <button type="button" onClick={() => setEditingId(null)} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={18} /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Properties</label>
                                  <input 
                                    type="text" placeholder="Name" required 
                                    value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-bento-accent outline-none font-bold"
                                  />
                                  <input 
                                    type="number" step="0.01" placeholder="Price" required
                                    value={editItem.price || ''} onChange={e => setEditItem({...editItem, price: parseFloat(e.target.value)})}
                                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-bento-accent outline-none font-bold"
                                  />
                                  {product.categoryId === 'crepes-desserts' && (
                                    <div className="pt-2">
                                      <label className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Subsection</label>
                                      <select 
                                        value={editItem.subSection} 
                                        onChange={e => setEditItem({...editItem, subSection: e.target.value})}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:ring-1 focus:ring-bento-accent outline-none font-bold appearance-none"
                                      >
                                        <option value="">None</option>
                                        <option value="crepes_salees">🌯 CRÊPES SALÉES</option>
                                        <option value="crepes_sucrees">🍫 CRÊPES SUCRÉES</option>
                                        <option value="gaufres">🧇 GAUFRES</option>
                                        <option value="pancakes">🥞 PANCAKES</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                <textarea 
                                  placeholder="Description"
                                  value={editItem.description} onChange={e => setEditItem({...editItem, description: e.target.value})}
                                  className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 h-20 text-xs focus:ring-2 focus:ring-bento-accent outline-none"
                                />
                              </div>
                              
                              <div className="space-y-4">
                                <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Change Image</label>
                                <div 
                                  onClick={() => editFileInputRef.current?.click()}
                                  className="w-full aspect-[2/1] bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-bento-accent transition-all relative overflow-hidden"
                                >
                                  {isUploading === editingId ? (
                                    <Loader2 className="text-bento-accent animate-spin" size={24} />
                                  ) : (
                                    <>
                                      {editItem.image && (
                                        <OptimizedImage 
                                          src={editItem.image} 
                                          className="w-full h-full object-cover opacity-60" 
                                          alt="Edit preview"
                                        />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="p-3 bg-white rounded-xl shadow-lg ring-1 ring-black/5">
                                          <Upload className="text-bento-primary" size={20} />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <input 
                                  type="file" 
                                  ref={editFileInputRef}
                                  onChange={(e) => handleFileUpload(e, 'edit')}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <button type="submit" className="w-full bg-bento-accent text-bento-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-bento-accent/10 hover:bg-stone-900 hover:text-white transition-all">
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
