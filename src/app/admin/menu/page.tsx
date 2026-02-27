"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Save, CheckCircle2, Trash2, Edit2, XCircle } from "lucide-react";
import { addMenu, getMenus, updateMenu, deleteMenu } from "@/app/actions";
import { toast } from "sonner";

export default function AdminMenu() {
  const [success, setSuccess] = useState(false);
  const [fileKey, setFileKey] = useState(Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    getMenus().then(data => setMenuItems(data));
  }, []);

  const [form, setForm] = useState({
     name: "",
     description: "",
     price: "",
     ImageUrl: "",
     category: "Paket",
     menuType: "customer"
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, ImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        if (editingId) {
             await updateMenu(editingId, {
                 name: form.name,
                 description: form.description,
                 price: form.menuType === 'doctor' ? 0 : (parseInt(form.price) || 0),
                 category: form.category,
                 imageUrl: form.ImageUrl,
                 menuType: form.menuType
             });
             toast.success("Menu updated successfully");
        } else {
             await addMenu({
                name: form.name,
                description: form.description,
                price: form.menuType === 'doctor' ? 0 : (parseInt(form.price) || 0),
                category: form.category,
                imageUrl: form.ImageUrl,
                menuType: form.menuType
             });
             toast.success("Menu added successfully");
        }

        const updated = await getMenus();
        setMenuItems(updated);

        setEditingId(null);
        setForm({ name: "", description: "", price: "", ImageUrl: "", category: "Paket", menuType: "customer" });
        setFileKey(Date.now());
    } catch(err) {
        toast.error("An error occurred");
    }
  };

  const handleEdit = (menu: any) => {
      setEditingId(menu.id);
      setForm({
          name: menu.name,
          description: menu.description || "",
          price: menu.price.toString(),
          category: menu.category,
          ImageUrl: menu.imageUrl || "",
          menuType: menu.menuType
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setForm({ name: "", description: "", price: "", ImageUrl: "", category: "Paket", menuType: "customer" });
      setFileKey(Date.now());
  };

  const handleDelete = async (id: string) => {
      if(confirm("Are you sure you want to delete this menu item?")) {
         try {
            await deleteMenu(id);
            toast.success("Menu deleted");
            const updated = await getMenus();
            setMenuItems(updated);
         } catch(e) {
            toast.error("Failed to delete menu. Ensure it's not tied to existing order items strongly.");
         }
      }
  };

  const formatPrice = (price: number) => {
     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8 flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-zinc-50">Manage Menus</h1>
           <p className="text-zinc-600 dark:text-zinc-400">Add or edit hospital food catalog items.</p>
         </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
         <div className="flex-[2] bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               {editingId ? <><Edit2 className="w-5 h-5"/> Edit Menu</> : <><Plus className="w-5 h-5"/> Add New Menu</>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Item Name</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sup Ayam Tahu" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Price (IDR)</label>
                    <input 
                       required={form.menuType !== 'doctor'} 
                       disabled={form.menuType === 'doctor'}
                       type="number" 
                       value={form.menuType === 'doctor' ? '0' : form.price} 
                       onChange={e => setForm({...form, price: e.target.value})} 
                       className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-zinc-200 disabled:dark:bg-zinc-900/50 disabled:text-zinc-400 disabled:cursor-not-allowed" 
                       placeholder="50000" 
                    />
                    {form.menuType === 'doctor' && (
                       <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-bold">Otomatis gratis (Jatah porsi dokter ditanggung RS)</p>
                    )}
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Category</label>
                 <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Paket">Paket</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Peruntukan Menu</label>
                 <select value={form.menuType} onChange={e => setForm({...form, menuType: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="customer">Orderan Customer (Umum)</option>
                    <option value="doctor">Orderan Khusus Dokter (H-1)</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
                 <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Healthy description for nutritional content..." />
               </div>

               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Image Upload</label>
                 <div className="flex gap-2">
                   <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <ImageIcon className="text-zinc-400" />
                   </div>
                   <input required={!editingId} key={fileKey} type="file" accept="image/*" onChange={handleImageUpload} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400" />
                 </div>
               </div>

               <div className="flex gap-4">
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 pt-3 rounded-xl transition-all active:scale-95">
                    <Save className="w-5 h-5" /> {editingId ? "Update Menu" : "Save Item to Menu"}
                  </button>
                  {editingId && (
                     <button type="button" onClick={handleCancelEdit} className="px-6 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold py-3 pt-3 rounded-xl transition-all active:scale-95">
                        <XCircle className="w-5 h-5" /> Cancel
                     </button>
                  )}
               </div>
            </form>
         </div>

         <div className="flex-1">
           <h3 className="font-bold text-lg mb-4">Current Master Data</h3>
           <div className="space-y-4">
              {menuItems.map(item => (
                 <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase mt-1">{item.category} • {item.menuType === 'doctor' ? 'Dokter' : 'Umum'}</p>
                        </div>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex justify-start gap-2 mt-2 opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                    </div>
                 </div>
              ))}
           </div>
         </div>
      </div>
    </div>
  )
}
