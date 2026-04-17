"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { registerUser, getDoctors, deleteDoctor, updateDoctor, getDoctorActions, updateDoctorActionCount, bulkAddUsers } from "@/app/actions";
import { Eye, EyeOff, Check, X, UserX, Camera, Edit2, Save, Activity, Plus, Minus, Download, FileJson } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function AdminDoctorRegister() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [doctorActionCounts, setDoctorActionCounts] = useState<Record<number, number>>({});

  const fetchDoctors = async () => {
     const data = await getDoctors();
     setDoctors(data);
     
     // Fetch action counts for today for all doctors
     const counts: Record<number, number> = {};
     const today = new Date().toISOString().split('T')[0];
     for (const doc of data) {
        const act = await getDoctorActions(doc.id, today);
        counts[doc.id] = act?.count ?? 1;
     }
     setDoctorActionCounts(counts);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Mempersiapkan data dokter...");

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
          name: String(item.Nama || item.name || ""),
          employeeId: String(item.No_Pegawai || item.employeeId || ""),
          email: String(item.Email || item.email || ""),
          role: "doctor"
        })).filter(i => i.name && i.email);

        if (formatted.length === 0) {
          toast.error("Format kolom tidak sesuai. Gunakan template!", { id: toastId });
          return;
        }

        const res = await bulkAddUsers(formatted);
        toast.success(`Berhasil mengimpor ${res.count} dokter!`, { id: toastId });
        fetchDoctors();
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
      { Nama: "Dr. Budi Santoso", No_Pegawai: "DOC001", Email: "budi@hermina.com" },
      { Nama: "Dr. Siti Aminah", No_Pegawai: "DOC002", Email: "siti@hermina.com" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Dokter");
    XLSX.writeFile(wb, "Template_Dokter_MyMeals.xlsx");
  };

  const validations = {
    length: password.length >= 5,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(validations).every(Boolean) || editId !== null;

  useEffect(() => {
    if (user && user.role !== "admin") {
       router.push("/");
    } else if (user) {
       fetchDoctors();
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return <div className="p-8">Access Denied</div>;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid && !editId) {
        toast.error("Please meet all password requirements.");
        return;
    }
    if (password !== confirmPassword && !editId) {
        toast.error("Passwords do not match.");
        return;
    }
    try {
      await registerUser({ name, email, password, role: "doctor", employeeId });
      toast.success("Doctor successfully registered!");
      setName("");
      setEmployeeId("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Failed to register doctor.");
    }
  };

  const handleEditClick = (doc: any) => {
      setEditId(doc.id);
      setEditName(doc.name);
      setEditEmployeeId(doc.employeeId || "");
  };

  const handleSaveEdit = async (docId: number) => {
      try {
          await updateDoctor(docId, { name: editName, employeeId: editEmployeeId });
          setEditId(null);
          toast.success("Doctor updated!");
          fetchDoctors();
      } catch(e: any) {
          toast.error("Failed to update doctor");
      }
  };

  const handleDelete = async (docId: number) => {
      if(confirm("Are you sure you want to delete this doctor account?")) {
         try {
             await deleteDoctor(docId);
             toast.success("Doctor deleted!");
             fetchDoctors();
         } catch(e: any) {
             toast.error("Failed to delete doctor.");
         }
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, docId: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              try {
                 await updateDoctor(docId, { image: reader.result as string });
                 toast.success("Photo updated successfully!");
                 fetchDoctors();
              } catch(e) {
                 toast.error("Failed to update photo");
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUpdateActionCount = async (docId: number, delta: number) => {
    const current = doctorActionCounts[docId] ?? 1;
    const newValue = Math.max(1, current + delta);
    const today = new Date().toISOString().split('T')[0];
    
    try {
       await updateDoctorActionCount(docId, today, newValue);
       setDoctorActionCounts(prev => ({ ...prev, [docId]: newValue }));
       toast.success("Jatah tindakan diperbarui");
    } catch (e) {
       toast.error("Gagal memperbarui jatah tindakan");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10">
        
        {/* Left Side: Register */}
        <div className="w-full xl:w-[450px] shrink-0">
            <h1 className="text-4xl font-black mb-2 tracking-tighter text-blue-900 dark:text-blue-100">Register Doctor</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-lg">Create new accounts for doctors.</p>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <form className="space-y-6" onSubmit={handleRegister}>
                <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Doctor Full Name
                </label>
                <div className="mt-2">
                    <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                    placeholder="Dr. Strange"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Employee ID
                </label>
                <div className="mt-2 text-zinc-900">
                    <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                    placeholder="EMP-12345"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Email address
                </label>
                <div className="mt-2">
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                    placeholder="doctor@hospital.com"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                </label>
                <div className="mt-2 relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all pr-12"
                    placeholder="••••••••"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                {password.length > 0 && (
                    <div className="mt-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs font-bold mb-2 text-zinc-600 dark:text-zinc-400">Password Requirements:</p>
                        <ul className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                        <li className={`flex items-center gap-1.5 ${validations.length ? 'text-emerald-600' : 'text-zinc-500'}`}>{validations.length ? <Check className="w-3" /> : <X className="w-3" />} Min. 5 characters</li>
                        <li className={`flex items-center gap-1.5 ${validations.uppercase ? 'text-emerald-600' : 'text-zinc-500'}`}>{validations.uppercase ? <Check className="w-3" /> : <X className="w-3" />} Uppercase letter</li>
                        <li className={`flex items-center gap-1.5 ${validations.lowercase ? 'text-emerald-600' : 'text-zinc-500'}`}>{validations.lowercase ? <Check className="w-3" /> : <X className="w-3" />} Lowercase letter</li>
                        <li className={`flex items-center gap-1.5 ${validations.number ? 'text-emerald-600' : 'text-zinc-500'}`}>{validations.number ? <Check className="w-3" /> : <X className="w-3" />} Number</li>
                        <li className={`flex items-center gap-1.5 ${validations.special ? 'text-emerald-600' : 'text-zinc-500'}`}>{validations.special ? <Check className="w-3" /> : <X className="w-3" />} Special char</li>
                        </ul>
                    </div>
                )}
                </div>

                <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Confirm Password
                </label>
                <div className="mt-2 relative">
                    <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all pr-12"
                    placeholder="••••••••"
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="submit"
                    className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.98]"
                >
                    Register Doctor
                </button>
                </div>
            </form>
            </div>
        </div>

        {/* Right Side: List Doctors */}
        <div className="flex-1">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-4 xl:mt-0 border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 italic">Daftar Dokter</h2>
                <div className="flex gap-2">
                   <button onClick={downloadTemplate} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
                      <Download className="w-4 h-4" /> Template
                   </button>
                   <label className="cursor-pointer p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold hover:bg-emerald-100 transition-all transition-all">
                      <FileJson className="w-4 h-4" /> Import Excel
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} disabled={isImporting} />
                   </label>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {doctors.map(doc => (
                     <div key={doc.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                         {/* Photo Upload area */}
                         <div className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30 shrink-0 shadow-inner">
                                {doc.image ? (
                                    <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-[10px] font-bold">
                                        No Photo
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer rounded-2xl transition-all">
                                <Camera className="w-6 h-6" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, doc.id)} />
                            </label>
                         </div>

                         <div className="flex-1 min-w-0 pb-3">
                             {editId === doc.id ? (
                                 <div className="flex flex-col gap-2 mb-2">
                                     <input 
                                       type="text" 
                                       className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-2 py-1 font-bold text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                       value={editName}
                                       placeholder="Doctor Name"
                                       onChange={e => setEditName(e.target.value)}
                                       autoFocus
                                     />
                                     <input 
                                       type="text" 
                                       className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-2 py-1 font-bold text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                       value={editEmployeeId}
                                       placeholder="Employee ID"
                                       onChange={e => setEditEmployeeId(e.target.value)}
                                     />
                                 </div>
                             ) : (
                                <div className="mb-2">
                                  <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 truncate">{doc.name}</h3>
                                  <p className="text-[11px] font-black uppercase text-indigo-500 mb-1 tracking-widest">{doc.employeeId ? `ID: ${doc.employeeId}` : "No Employee ID"}</p>
                                </div>
                             )}
                             <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-1">{doc.email}</p>
                             
                             <div className="flex items-center gap-3 mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 w-fit">
                                <div className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                   <Activity className="w-3.5 h-3.5 text-rose-500" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[8px] font-black uppercase text-zinc-400 leading-none">Tindakan Hari Ini</span>
                                   <div className="flex items-center gap-3">
                                      <button onClick={() => handleUpdateActionCount(doc.id, -1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400"><Minus className="w-3 h-3" /></button>
                                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">{doctorActionCounts[doc.id] ?? 1}</span>
                                      <button onClick={() => handleUpdateActionCount(doc.id, 1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-rose-500"><Plus className="w-3 h-3" /></button>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex gap-2">
                                 {editId === doc.id ? (
                                     <button onClick={() => handleSaveEdit(doc.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-bold transition-all"><Save className="w-3 h-3" /> Save</button>
                                 ) : (
                                     <button onClick={() => handleEditClick(doc)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-all"><Edit2 className="w-3 h-3" /> Edit</button>
                                 )}
                                 <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-bold transition-all"><UserX className="w-3 h-3" /> Remove</button>
                             </div>
                         </div>
                     </div>
                 ))}
                 
                 {doctors.length === 0 && (
                     <div className="col-span-full p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl font-medium">
                         Belum ada dokter yang terdaftar.
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
}
