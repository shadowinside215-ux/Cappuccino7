import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
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

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), newItem);
      setIsAdding(false);
      setNewItem({ name: '', description: '', price: 0, categoryId: '', image: '', isAvailable: true });
      toast.success('Product added!');
    } catch (err) { toast.error('Failed to add product'); }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable });
    } catch (err) { toast.error('Update failed'); }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      try { await deleteDoc(doc(db, 'products', id)); toast.success('Deleted'); }
      catch (err) { toast.error('Delete failed'); }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brown-950">Menu Designer</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-brown-600 text-white p-3 rounded-2xl flex items-center gap-2 hover:bg-brown-700 transition-colors"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-brown-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">New Menu Item</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Name" required 
              value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
              className="bg-gray-50 border-0 rounded-xl p-3"
            />
            <input 
              type="number" step="0.01" placeholder="Price" required
              value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
              className="bg-gray-50 border-0 rounded-xl p-3"
            />
            <select 
              required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
              className="bg-gray-50 border-0 rounded-xl p-3"
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input 
              type="text" placeholder="Image URL (optional)"
              value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})}
              className="bg-gray-50 border-0 rounded-xl p-3"
            />
          </div>
          <textarea 
            placeholder="Description"
            value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
            className="bg-gray-50 border-0 rounded-xl p-3 w-full h-24"
          />
          <button type="submit" className="w-full bg-brown-600 text-white py-3 rounded-xl font-bold shadow-md shadow-brown-100">
            Create Product
          </button>
        </form>
      )}

      <div className="space-y-6">
        {categories.map(cat => (
          <section key={cat.id} className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] pl-1">{cat.name}</h2>
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.categoryId === cat.id).map(product => (
                <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
                  <img 
                    src={product.image || 'https://picsum.photos/seed/coffee/100/100'} 
                    className={`w-16 h-16 object-cover rounded-xl ${!product.isAvailable && 'grayscale opacity-50'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-brown-950">{product.name}</h3>
                    <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleAvailability(product)}
                      className={`p-2 rounded-lg ${product.isAvailable ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
                      title={product.isAvailable ? 'Hide from menu' : 'Show on menu'}
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 rounded-lg text-red-500 bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
