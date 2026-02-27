"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Camera, Save, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: user?.name || "",
    image: user?.image || "",
  });
  const [success, setSuccess] = useState(false);

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: form.name, image: form.image });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950 flex justify-center">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-xl">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-zinc-50 text-center">My Profile</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">Personalize your healthcare account details.</p>

        {success && (
           <div className="mb-6 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 p-4 rounded-xl font-bold text-center text-sm">
             Profile updated successfully!
           </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 flex flex-col items-center">
           <div className="relative group w-32 h-32 mb-4">
              {form.image ? (
                <Image src={form.image} alt="Profile" className="w-full h-full object-cover rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-xl" />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-4 border-white dark:border-zinc-800 shadow-xl text-indigo-500">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-lg transition-transform active:scale-95">
                 <Camera className="w-5 h-5" />
                 <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
           </div>

           <div className="w-full space-y-4">
             <div>
               <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Full Name</label>
               <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
             </div>
             <div>
               <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Registered Email</label>
               <input type="email" value={user.email} disabled className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed font-medium" />
             </div>
             <div>
               <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">System Role</label>
               <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 rounded-xl px-4 py-3 uppercase font-bold tracking-widest text-sm">
                 {user.role}
               </div>
             </div>
           </div>

           <button type="submit" className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
             <Save className="w-5 h-5" /> Save Changes
           </button>
        </form>
      </div>
    </div>
  );
}
