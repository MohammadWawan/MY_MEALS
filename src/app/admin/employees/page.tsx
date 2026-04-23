"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getStaffAndCustomers, updateEmployee, deleteEmployee, bulkAddUsers } from "@/app/actions";
import { Search, Edit2, Save, UserX, Camera, UserSquare2, XCircle, PlusCircle, Download, FileJson } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function AdminEmployeeManager() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  const fetchEmployees = async () => {
     const data = await getStaffAndCustomers();
     setEmployees(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Mempersiapkan data staff...");

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
          role: String(item.Role || item.role || "waiter").toLowerCase()
        })).filter(i => i.name && i.email);

        if (formatted.length === 0) {
          toast.error("Format kolom tidak sesuai. Gunakan template!", { id: toastId });
          return;
        }

        const res = await bulkAddUsers(formatted);
        toast.success(`Berhasil mengimpor ${res.count} staff!`, { id: toastId });
        fetchEmployees();
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
      { Nama: "Budi Kasir", No_Pegawai: "EMP001", Email: "budi@hermina.com", Role: "cashier" },
      { Nama: "Siti Catering", No_Pegawai: "EMP002", Email: "siti@hermina.com", Role: "catering" },
      { Nama: "Agus Waiter", No_Pegawai: "EMP003", Email: "agus@hermina.com", Role: "waiter" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Staff");
    XLSX.writeFile(wb, "Template_Staff_MyMeals.xlsx");
  };

  useEffect(() => {
    if (user && user.role !== "admin") {
       router.push("/");
    } else if (user) {
       fetchEmployees();
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const handleEditClick = (emp: any) => {
      setEditId(emp.id);
      setEditName(emp.name);
      setEditEmail(emp.email);
      setEditRole(emp.role);
  };

  const handleGetEmployee = (emp: any) => {
      setEditId(emp.id);
      setEditName(emp.name);
      setEditEmail(emp.email);
      // Automatically suggest 'cashier' role when pulling a customer
      setEditRole("cashier");
      setSearchQuery("");
  }

  const handleCancelEdit = () => {
      setEditId(null);
  }

  const handleSaveEdit = async (empId: number) => {
      try {
          await updateEmployee(empId, { name: editName, email: editEmail, role: editRole });
          setEditId(null);
          toast.success("Employee data updated successfully!");
          fetchEmployees();
      } catch(e: any) {
          toast.error("Failed to update employee.");
      }
  };

  const handleDelete = async (empId: number) => {
      if(confirm("Are you sure you want to delete this user? Action cannot be undone.")) {
         try {
             await deleteEmployee(empId);
             toast.success("User deleted successfully!");
             fetchEmployees();
         } catch(e: any) {
             toast.error("Failed to delete user.");
         }
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, empId: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              try {
                 await updateEmployee(empId, { image: reader.result as string });
                 toast.success("Photo updated successfully!");
                 fetchEmployees();
              } catch(e) {
                 toast.error("Failed to update photo");
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const searchResults = searchQuery.trim() === "" ? [] : employees.filter(emp => 
     emp.role === 'customer' && 
     (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayStaff = employees.filter(emp => emp.role !== 'customer' || emp.id === editId);

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-black">
       <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
             <div>
                <h1 className="text-4xl font-black mb-2 tracking-tighter text-indigo-900 dark:text-indigo-100 flex items-center gap-3 justify-center md:justify-start">
                   <UserSquare2 className="w-10 h-10 text-indigo-500" /> Manage Staff
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg">Promote customers to staff or edit employee data.</p>
                <div className="flex gap-2 mt-4">
                   <button onClick={downloadTemplate} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2 text-[10px] font-bold shadow-sm uppercase tracking-wider">
                      <Download className="w-3 h-3" /> Template
                   </button>
                   <label className="cursor-pointer p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center gap-2 text-[10px] font-bold hover:bg-indigo-100 transition-all uppercase tracking-wider">
                      <FileJson className="w-3 h-3" /> Import Excel
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} disabled={isImporting} />
                   </label>
                </div>
             </div>
             
             <div className="w-full md:w-[450px] relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                 <input 
                    type="text" 
                    placeholder="Search customer by name or email to add..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                 />
                 
                 {/* Search Results Dropdown-like */}
                 {searchQuery.trim() !== "" && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                       {searchResults.length > 0 ? (
                           <div className="p-2 flex flex-col gap-2">
                               {searchResults.map(res => (
                                   <div key={res.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
                                       <div className="flex items-center gap-3 overflow-hidden">
                                           <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                               {res.image ? <img src={res.image} alt={res.name} className="w-full h-full rounded-full object-cover"/> : <UserSquare2 className="w-5 h-5 text-indigo-500"/>}
                                           </div>
                                           <div className="truncate">
                                               <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{res.name}</p>
                                               <p className="text-[10px] text-zinc-500 truncate">{res.email}</p>
                                           </div>
                                       </div>
                                       <button onClick={() => handleGetEmployee(res)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md">
                                           <PlusCircle className="w-3 h-3" /> Get Employee
                                       </button>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="p-6 text-center text-zinc-500 text-sm font-medium">
                               No customers found matching &quot;{searchQuery}&quot;
                           </div>
                       )}
                    </div>
                 )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {displayStaff.map(emp => (
                 <div key={emp.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-2xl">
                    <div className="relative group shrink-0 mb-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg shrink-0 flex items-center justify-center">
                            {emp.image ? (
                                <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserSquare2 className="w-10 h-10 text-zinc-300" />
                            )}
                        </div>
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer rounded-full transition-all">
                            <Camera className="w-6 h-6" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, emp.id)} />
                        </label>
                    </div>

                    <div className="w-full">
                       {editId === emp.id ? (
                           <div className="flex flex-col gap-3 mb-6 w-full text-left">
                               <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name</label>
                                  <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                               </div>
                               <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
                                  <input type="email" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                               </div>
                               <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Role</label>
                                   <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                       <option value="customer">Customer / Pasien</option>
                                       <option value="cashier">Cashier</option>
                                       <option value="catering">Catering / Kitchen</option>
                                       <option value="waiter">Waiter / Server</option>
                                       <option value="perawat">Perawat / Nurse</option>
                                       <option value="admin">Admin</option>
                                   </select>
                               </div>
                           </div>
                       ) : (
                          <div className="mb-6 h-28">
                             <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100 truncate mb-1">{emp.name}</h3>
                             <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate mb-3">{emp.email}</p>
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${
                                emp.role === 'customer' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 
                                emp.role === 'cashier' ? 'bg-emerald-100 text-emerald-700' :
                                emp.role === 'catering' ? 'bg-amber-100 text-amber-700' :
                                emp.role === 'perawat' ? 'bg-pink-100 text-pink-700' :
                                emp.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                                'bg-indigo-100 text-indigo-700'
                             }`}>
                                 {emp.role}
                             </span>
                          </div>
                       )}

                       <div className="flex gap-2 justify-center w-full mt-auto">
                           {editId === emp.id ? (
                               <>
                                 <button onClick={() => handleSaveEdit(emp.id)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"><Save className="w-4 h-4" /> Save</button>
                                 <button onClick={handleCancelEdit} className="p-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-all"><XCircle className="w-5 h-5" /></button>
                               </>
                           ) : (
                               <>
                                 <button onClick={() => handleEditClick(emp)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-xl font-bold transition-all"><Edit2 className="w-4 h-4" /> Edit Profile</button>
                                 <button onClick={() => handleDelete(emp.id)} className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 rounded-xl transition-all"><UserX className="w-5 h-5" /></button>
                               </>
                           )}
                       </div>
                    </div>
                 </div>
             ))}

             {displayStaff.length === 0 && (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                    <UserSquare2 className="w-20 h-20 mb-4 text-zinc-400" />
                    <p className="text-2xl font-black uppercase tracking-widest mb-2">No Staff Members</p>
                    <p className="text-sm font-medium text-zinc-500">Search for customers above to promote them to staff.</p>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
}
