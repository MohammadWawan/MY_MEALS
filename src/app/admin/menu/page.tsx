"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Save, CheckCircle2, Trash2, Edit2, XCircle, PlusCircle, MinusCircle } from "lucide-react";
import { addMenu, getMenus, updateMenu, deleteMenu } from "@/app/actions";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export default function AdminMenu() {
  const [success, setSuccess] = useState(false);
  const [fileKey, setFileKey] = useState(Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getMenus().then(data => setMenuItems(data));
  }, []);

  const [form, setForm] = useState({
     name: "",
     description: "",
     price: "",
     ImageUrl: "",
     category: "Paket",
     menuType: "customer",
     nutrition: [] as { indicator: string; value: string }[]
  });

  const addNutritionRow = () => setForm(f => ({ ...f, nutrition: [...f.nutrition, {indicator: "", value: ""}] }));
  
  const updateNutrition = (index: number, field: "indicator" | "value", val: string) => {
     const newNutri = [...form.nutrition];
     newNutri[index] = { ...newNutri[index], [field]: val };
     setForm(f => ({ ...f, nutrition: newNutri }));
  };
  
  const removeNutritionRow = (index: number) => {
     const newNutri = form.nutrition.filter((_, i) => i !== index);
     setForm(f => ({ ...f, nutrition: newNutri }));
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("File terlalu besar. Maksimal ukuran file adalah 1MB");
        e.target.value = "";
        e.target.setCustomValidity("Ukuran file melebihi 1MB. Silakan pilih file yang lebih kecil.");
        return;
      }
      e.target.setCustomValidity("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, ImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      e.target.setCustomValidity("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Memperbarui menu..." : "Menambah menu baru...");
    
    try {
        const payload = {
            name: form.name,
            description: form.description,
            price: form.menuType === 'doctor' ? 0 : (parseInt(form.price) || 0),
            category: form.category,
            imageUrl: form.ImageUrl,
            menuType: form.menuType,
            nutrition: JSON.stringify(form.nutrition)
        };

        if (editingId) {
             await updateMenu(editingId, payload, user?.id);
             toast.dismiss(loadingToast);
             toast.success("Data menu berhasil diperbarui.");
        } else {
             await addMenu(payload, user?.id);
             toast.dismiss(loadingToast);
             toast.success("Menu baru berhasil ditambahkan.");
        }

        const updated = await getMenus();
        setMenuItems(updated);

        setEditingId(null);
        setForm({ 
            name: "", 
            description: "", 
            price: "", 
            ImageUrl: "", 
            category: "Paket", 
            menuType: "customer", 
            nutrition: [] 
        });
        setFileKey(Date.now());
        setIsSubmitting(false);
    } catch(err: any) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Gagal menyimpan menu. Pastikan koneksi stabil.");
        setIsSubmitting(false);
    }
  };

  const handleEdit = (menu: any) => {
      setEditingId(menu.id);
      let parsedNutrition = [];
      try {
        if (menu.nutrition) parsedNutrition = JSON.parse(menu.nutrition);
      } catch(e){}
      
      setForm({
          name: menu.name,
          description: menu.description || "",
          price: menu.price.toString(),
          category: menu.category,
          ImageUrl: menu.imageUrl || "",
          menuType: menu.menuType,
          nutrition: parsedNutrition
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setForm({ name: "", description: "", price: "", ImageUrl: "", category: "Paket", menuType: "customer", nutrition: [] });
      setFileKey(Date.now());
  };

  const handleDelete = async (id: string) => {
      if(confirm("Apakah Anda yakin ingin menghapus menu ini dari katalog?")) {
         const loadingToast = toast.loading("Menghapus menu...");
         try {
            await deleteMenu(id, user?.id);
            toast.dismiss(loadingToast);
            toast.success("Menu berhasil dihapus.");
            const updated = await getMenus();
            setMenuItems(updated);
         } catch(e) {
            toast.dismiss(loadingToast);
            toast.error("Gagal menghapus menu. Menu mungkin masih terikat dengan data pesanan.");
         }
      }
  };

  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8 flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-zinc-50 tracking-tighter">Manage Menus</h1>
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

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
               </div>

               


               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
                 <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Healthy description for nutritional content..." />
               </div>

               <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Nutrition Facts</h3>
                     <button type="button" onClick={addNutritionRow} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold transition-all">
                        <PlusCircle className="w-4 h-4" /> Add Nutrition
                     </button>
                  </div>
                  <div className="space-y-3">
                     {form.nutrition.map((n, i) => (
                        <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                           <input type="text" placeholder="Indicator (e.g. Protein)" value={n.indicator} onChange={e => updateNutrition(i, "indicator", e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                           <input type="text" placeholder="Value (e.g. 20g)" value={n.value} onChange={e => updateNutrition(i, "value", e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                           <button type="button" onClick={() => removeNutritionRow(i)} className="text-rose-500 hover:text-rose-600">
                              <MinusCircle className="w-5 h-5" />
                           </button>
                        </div>
                     ))}
                     {form.nutrition.length === 0 && (
                        <p className="text-center text-zinc-400 text-xs italic">No nutrition facts added yet.</p>
                     )}
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Image Upload</label>
                 <div className="flex gap-2">
                   <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <ImageIcon className="text-zinc-400" />
                   </div>
                   <input required={!editingId} key={fileKey} type="file" accept="image/*" onChange={handleImageUpload} onInvalid={(e) => { const target = e.target as HTMLInputElement; if (!target.value && !target.validationMessage.includes("1MB")) { target.setCustomValidity("Harap unggah gambar menu"); } }} onInput={(e) => { const target = e.target as HTMLInputElement; if (target.value && !target.validationMessage.includes("1MB")) { target.setCustomValidity(""); } }} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400" />
                 </div>
               </div>

                <div className="flex gap-4">
                   <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                     <Save className="w-5 h-5" /> {isSubmitting ? "Memproses..." : (editingId ? "Update Menu" : "Save Item to Menu")}
                   </button>
                   {editingId && (
                      <button type="button" disabled={isSubmitting} onClick={handleCancelEdit} className="px-6 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                         <XCircle className="w-5 h-5" /> Cancel
                      </button>
                   )}
                </div>
            </form>
         </div>

         <div className="flex-1">
           <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">Current Master Data</h3>
           <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              {menuItems.map(item => (
                 <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="overflow-hidden">
                           <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">{item.name}</p>
                           <p className="text-[10px] text-zinc-500 uppercase mt-0.5 tracking-wider font-medium">{item.category} • {item.menuType === 'doctor' ? 'Dokter' : 'Umum'}</p>
                        </div>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex justify-start gap-2 mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                    </div>
                 </div>
              ))}
              {menuItems.length === 0 && (
                 <div className="py-10 text-center text-zinc-400 text-sm">
                    No menu items found.
                 </div>
              )}
           </div>
         </div>
      </div>
    </div>
  );
}
