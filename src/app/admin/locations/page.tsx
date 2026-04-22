"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, MapPin } from "lucide-react";
import { getLocations, addLocation, updateLocation, deleteLocation, bulkAddLocations } from "@/app/actions";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';

export default function LocationsAdmin() {
  const { user } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({ floor: "", name: "" });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push("/");
    } else {
      fetchLocations();
    }
  }, [user, router]);

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data.sort((a: any, b: any) => a.floor.localeCompare(b.floor, undefined, { numeric: true })));
    } catch (e) {
      toast.error("Gagal mengambil data lokasi");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Mempersiapkan data excel...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("File kosong!", { id: toastId });
          return;
        }

        const formatted = data.map((item: any) => ({
          floor: String(item.Lantai || item.floor || ""),
          name: String(item.Nama_Lokasi || item.name || "")
        })).filter(i => i.floor && i.name);

        if (formatted.length === 0) {
          toast.error("Format kolom tidak sesuai. Gunakan template!", { id: toastId });
          return;
        }

        await bulkAddLocations(formatted);
        toast.success(`Berhasil mengimpor ${formatted.length} lokasi!`, { id: toastId });
        fetchLocations();
      } catch (err) {
        toast.error("Gagal memproses file excel", { id: toastId });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Lantai: "Lantai 1", Nama_Lokasi: "IGD" },
      { Lantai: "Lantai 1", Nama_Lokasi: "Poliklinik Umum" },
      { Lantai: "Lantai 2", Nama_Lokasi: "Rayat Inap A" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Lokasi");
    XLSX.writeFile(wb, "Template_Lokasi_MyMeals.xlsx");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.floor || !formData.name) return toast.error("Semua field wajib diisi");
    try {
      await addLocation(formData);
      toast.success("Lokasi berhasil ditambahkan");
      setShowAdd(false);
      setFormData({ floor: "", name: "" });
      fetchLocations();
    } catch (e) {
      toast.error("Gagal menambah lokasi");
    }
  };

  const handleUpdate = async (id: string) => {
    const loc = locations.find(l => l.id === id);
    if (!loc.floor || !loc.name) return toast.error("Semua field wajib diisi");
    try {
      await updateLocation(id, { floor: loc.floor, name: loc.name });
      toast.success("Lokasi berhasil diperbarui");
      setIsEditing(null);
      fetchLocations();
    } catch (e) {
      toast.error("Gagal memperbarui lokasi");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus lokasi ini?")) {
      try {
        await deleteLocation(id);
        toast.success("Lokasi dihapus");
        fetchLocations();
      } catch (e) {
        toast.error("Gagal menghapus lokasi");
      }
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
              <MapPin className="text-rose-500" /> Kelola Lokasi
            </h1>
            <p className="text-zinc-500 font-medium">Tambah atau perbarui titik pengiriman makanan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button 
               onClick={downloadTemplate}
               className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2"
             >
                Template
             </button>
             <label className="cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-4 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                Import Excel
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} disabled={isImporting} />
             </label>
             <button 
               onClick={() => setShowAdd(true)}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 text-xs md:text-sm"
             >
               <Plus className="w-5 h-5" /> TAMBAH LOKASI
             </button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl mb-10 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500" /> Lokasi Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Lantai</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Lantai 1, Gedung A..." 
                  value={formData.floor} 
                  onChange={e => setFormData({...formData, floor: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Nama Unit / Lokasi</label>
                <input 
                  type="text" 
                  placeholder="Contoh: IGD, Poliklinik, Rawat Inap..." 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl transition-all">Batal</button>
              <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Simpan Lokasi</button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Lantai</th>
                <th className="px-8 py-5">Nama Unit / Lokasi</th>
                <th className="px-8 py-5 text-right font-sans">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {locations.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-zinc-400 font-bold italic">Belum ada data lokasi.</td>
                </tr>
              )}
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-8 py-4">
                    {isEditing === loc.id ? (
                      <input 
                        type="text" 
                        value={loc.floor} 
                        onChange={e => setLocations(locations.map(l => l.id === loc.id ? {...l, floor: e.target.value} : l))}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold w-full"
                      />
                    ) : (
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{loc.floor}</span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    {isEditing === loc.id ? (
                      <input 
                        type="text" 
                        value={loc.name} 
                        onChange={e => setLocations(locations.map(l => l.id === loc.id ? {...l, name: e.target.value} : l))}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold w-full"
                      />
                    ) : (
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{loc.name}</span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing === loc.id ? (
                        <>
                          <button onClick={() => setIsEditing(null)} className="p-2 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                          <button onClick={() => handleUpdate(loc.id)} className="p-2 text-emerald-500 hover:text-emerald-600"><Save className="w-5 h-5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setIsEditing(loc.id)} className="p-2 text-zinc-400 hover:text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(loc.id)} className="p-2 text-zinc-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
