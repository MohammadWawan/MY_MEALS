"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Search, Plus, Stethoscope, User, Clock, Shield, Trash2, Edit2, Save, X, ChevronDown } from "lucide-react";
import { getDoctors, getSurgerySchedules, addSurgerySchedule, updateSurgerySchedule, deleteSurgerySchedule } from "@/app/actions";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NurseDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Jakarta', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date());
  });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formDoctorId, setFormDoctorId] = useState<number | "">("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [docData, schData] = await Promise.all([
        getDoctors(),
        getSurgerySchedules(selectedDate)
      ]);
      setDoctors(docData);
      setSchedules(schData);
    } catch (e) {
      console.error("Failed to load data", e);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  // Role protection
  useEffect(() => {
    if (mounted && user && user.role !== 'perawat' && user.role !== 'admin') {
      toast.error("Akses ditolak. Hanya perawat yang dapat mengakses halaman ini.");
      router.push("/");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) return null;
  if (user.role !== 'perawat' && user.role !== 'admin') return null;

  const resetForm = () => {
    setFormDoctorId("");
    setFormDate(selectedDate);
    setFormStartTime("");
    setFormEndTime("");
    setFormDescription("");
    setEditId(null);
  };

  const openAddForm = () => {
    resetForm();
    setFormDate(selectedDate);
    setShowForm(true);
  };

  const openEditForm = (sch: any) => {
    setEditId(sch.id);
    setFormDoctorId(sch.doctorId);
    setFormDate(sch.date);
    setFormStartTime(sch.startTime);
    setFormEndTime(sch.endTime);
    setFormDescription(sch.description || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDoctorId || !formDate || !formStartTime || !formEndTime) {
      toast.error("Mohon lengkapi semua field yang wajib.");
      return;
    }
    if (formStartTime >= formEndTime) {
      toast.error("Jam mulai harus lebih awal dari jam selesai.");
      return;
    }

    const loadingToast = toast.loading(editId ? "Memperbarui jadwal..." : "Menambah jadwal...");

    try {
      if (editId) {
        const res = await updateSurgerySchedule(editId, {
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          description: formDescription || undefined,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("Jadwal operasi berhasil diperbarui!", { id: loadingToast });
      } else {
        const res = await addSurgerySchedule({
          doctorId: formDoctorId as number,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          description: formDescription || undefined,
          createdByName: user.name,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("Jadwal operasi berhasil ditambahkan!", { id: loadingToast });
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan jadwal.", { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal operasi ini? Jatah konsumsi dokter akan berkurang.")) return;
    const loadingToast = toast.loading("Menghapus jadwal...");
    try {
      const res = await deleteSurgerySchedule(id);
      if (!res.success) throw new Error(res.error);
      toast.success("Jadwal operasi dihapus.", { id: loadingToast });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus jadwal.", { id: loadingToast });
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Group schedules by doctor
  const grouped: Record<number, { doctor: any, schedules: any[] }> = {};
  schedules.forEach((sch: any) => {
    if (!grouped[sch.doctorId]) {
      grouped[sch.doctorId] = { doctor: sch.doctor, schedules: [] };
    }
    grouped[sch.doctorId].schedules.push(sch);
  });

  // Doctors that match search
  const filteredGroupKeys = Object.keys(grouped).filter(k => {
    const doc = grouped[Number(k)].doctor;
    if (!searchQuery) return true;
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (doc.employeeId && doc.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Doctors without schedules on this date (for the info)
  const doctorsWithSchedule = new Set(Object.keys(grouped).map(Number));

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-4 tracking-tighter text-zinc-900 dark:text-white">
                <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                Jadwal Operasi
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">
                Kelola jadwal operasi dokter. Setiap jadwal = 1 jatah konsumsi.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 px-4 py-2 rounded-2xl">
                  <Shield className="w-4 h-4 text-pink-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">
                    Perawat: {user.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari dokter..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 shadow-sm transition-all"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setLoading(true); }}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 shadow-sm"
                />
              </div>
              <button
                onClick={openAddForm}
                className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-pink-600/20 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Tambah Jadwal
              </button>
            </div>
          </div>
        </div>

        {/* Date Indicator + Stats */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">
              {isToday ? "Hari Ini" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {isToday && (
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <div className="flex gap-4 text-sm font-bold">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-2 rounded-2xl">
              <span className="text-zinc-400 text-[10px] uppercase tracking-widest">Jadwal</span>
              <span className="ml-2 text-pink-600 font-black">{schedules.length}</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-2 rounded-2xl">
              <span className="text-zinc-400 text-[10px] uppercase tracking-widest">Dokter</span>
              <span className="ml-2 text-indigo-600 font-black">{Object.keys(grouped).length}</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-pink-50 to-indigo-50 dark:from-pink-950/20 dark:to-indigo-950/20 border border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 mb-10">
          <h3 className="text-sm font-black text-pink-700 dark:text-pink-400 mb-2">ℹ️ Aturan Jatah Konsumsi Dokter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tanpa Jadwal</p>
              <p className="text-lg font-black text-red-500">Tidak bisa pesan</p>
              <p className="text-zinc-500 mt-1">Dokter harus punya jadwal operasi</p>
            </div>
            <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">1 Jadwal Operasi</p>
              <p className="text-lg font-black text-amber-600">1x Makan</p>
              <p className="text-zinc-500 mt-1">Satu kali jatah konsumsi</p>
            </div>
            <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">≥ 2 Jadwal Operasi</p>
              <p className="text-lg font-black text-emerald-600">2x Makan</p>
              <p className="text-zinc-500 mt-1">Dua kali jatah konsumsi (maks)</p>
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                      {editId ? <Edit2 className="w-5 h-5 text-pink-600" /> : <Plus className="w-5 h-5 text-pink-600" />}
                    </div>
                    {editId ? "Edit Jadwal" : "Jadwal Baru"}
                  </h2>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                    <X className="w-6 h-6 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Doctor Select */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Dokter *</label>
                    <select
                      value={formDoctorId}
                      onChange={e => setFormDoctorId(Number(e.target.value))}
                      disabled={!!editId}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none disabled:opacity-50"
                      required
                    >
                      <option value="">Pilih Dokter...</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name} {doc.employeeId ? `(${doc.employeeId})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Tanggal Operasi *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                      required
                    />
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Jam Mulai *</label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={e => setFormStartTime(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Jam Selesai *</label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={e => setFormEndTime(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Keterangan (Opsional)</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      placeholder="Contoh: Operasi Jantung, Appendix, dll"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none placeholder:text-zinc-400 placeholder:font-medium"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-pink-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editId ? "Simpan Perubahan" : "Buat Jadwal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Schedule List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredGroupKeys.length === 0 && schedules.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Calendar className="w-16 h-16 text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-bold text-xl uppercase tracking-widest mb-2">
              Belum ada jadwal operasi
            </p>
            <p className="text-zinc-400 text-sm font-medium mb-6">Klik tombol "Tambah Jadwal" untuk membuat jadwal operasi dokter.</p>
            <button onClick={openAddForm} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg">
              <Plus className="w-4 h-4 inline mr-2" /> Tambah Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroupKeys.map(key => {
              const docId = Number(key);
              const { doctor, schedules: docSchedules } = grouped[docId];
              const maxMeals = docSchedules.length >= 2 ? 2 : 1;

              return (
                <div key={docId} className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all">
                  {/* Doctor Header */}
                  <div className={`px-8 py-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 ${
                    maxMeals >= 2 ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-amber-50/50 dark:bg-amber-950/10'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-pink-100 dark:border-pink-900/30 shadow-inner shrink-0 flex items-center justify-center">
                        {doctor?.image ? (
                          <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100">{doctor?.name}</h3>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">
                          {doctor?.employeeId ? `ID: ${doctor.employeeId}` : "Dokter"} • {docSchedules.length} jadwal
                        </p>
                      </div>
                    </div>
                    <div className={`px-5 py-2 rounded-2xl text-center ${
                      maxMeals >= 2 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Jatah</p>
                      <p className={`text-xl font-black ${maxMeals >= 2 ? 'text-emerald-600' : 'text-amber-600'}`}>{maxMeals}x</p>
                    </div>
                  </div>

                  {/* Schedule Items */}
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {docSchedules.map((sch: any) => (
                      <div key={sch.id} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-pink-500" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-zinc-100 text-lg">
                              {sch.startTime} – {sch.endTime}
                            </p>
                            {sch.description && (
                              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{sch.description}</p>
                            )}
                            {sch.createdByName && (
                              <p className="text-[10px] font-bold text-zinc-400 mt-1">Dibuat oleh: {sch.createdByName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(sch)}
                            className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sch.id)}
                            className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredGroupKeys.length === 0 && searchQuery && (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <Search className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">Tidak ditemukan jadwal untuk &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
