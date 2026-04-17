"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Lock, Mail, Save, ArrowLeft, Settings as SettingsIcon, ShieldAlert, LayoutGrid, Ticket, UserPlus, Users, MapPin, User as UserIcon } from "lucide-react";
import { changeEmail, changePassword } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [emailForm, setEmailForm] = useState({ email: user?.email || "" });
  const [passForm, setPassForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.email === user.email) return toast.info("Email masih sama.");
    setLoadingEmail(true);
    try {
      await changeEmail(user.id, emailForm.email);
      updateUser({ email: emailForm.email });
      toast.success("Email berhasil diubah!");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah email.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok.");
    }
    if (passForm.newPassword.length < 6) {
      return toast.error("Password minimal 6 karakter.");
    }
    setLoadingPass(true);
    try {
      await changePassword(user.id, passForm.newPassword);
      toast.success("Password berhasil diubah!");
      setPassForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password.");
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-zinc-200 pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
         {/* SIDEBAR */}
         <div className="w-full md:w-64 shrink-0">
             <div className="flex flex-col gap-1">
                 <Link href="/profile" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                    <UserIcon className="w-4 h-4 text-zinc-500" /> Public profile
                 </Link>
                 <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-semibold rounded-md bg-zinc-100 dark:bg-[#161b22] relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-md"></div>
                    <SettingsIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Account
                 </div>
             </div>

             {user.role === 'admin' && (
                 <>
                   <div className="mt-8 mb-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Admin center</div>
                   <div className="flex flex-col gap-1">
                       <Link href="/admin/menu" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                          <LayoutGrid className="w-4 h-4 text-zinc-500" /> {t('nav.manage_menus')}
                       </Link>
                       <Link href="/admin/coupons" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                          <Ticket className="w-4 h-4 text-zinc-500" /> {t('nav.manage_coupons')}
                       </Link>
                       <Link href="/admin/doctors" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                          <UserPlus className="w-4 h-4 text-zinc-500" /> {t('nav.add_doctor')}
                       </Link>
                       <Link href="/admin/employees" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                          <Users className="w-4 h-4 text-zinc-500" /> {t('nav.manage_staff')}
                       </Link>
                       <Link href="/admin/locations" className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] transition-colors">
                          <MapPin className="w-4 h-4 text-zinc-500" /> {t('nav.manage_locations')}
                       </Link>
                   </div>
                 </>
             )}
         </div>

         {/* CONTENT */}
         <div className="flex-1 max-w-3xl">
             <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
                 <h1 className="text-2xl font-semibold">Account settings</h1>
             </div>

             <div className="space-y-10">
                 {/* Email Section */}
                 <div>
                    <h2 className="text-xl font-semibold mb-1">Email</h2>
                    <p className="text-sm font-medium border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4 text-zinc-600 dark:text-zinc-400">
                        Update your primary email address. 
                    </p>
                    <form onSubmit={handleUpdateEmail} className="space-y-5">
                        <div className="max-w-md">
                            <label className="block text-sm font-semibold mb-2">Primary email</label>
                            <input 
                                type="email" 
                                value={emailForm.email} 
                                onChange={e => setEmailForm({ email: e.target.value })} 
                                required 
                                className="w-full bg-white dark:bg-[#0d1117] border border-zinc-300 dark:border-zinc-700/80 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" 
                            />
                        </div>
                        <button disabled={loadingEmail} type="submit" className="px-4 py-1.5 bg-zinc-100 dark:bg-[#21262d] hover:bg-zinc-200 dark:hover:bg-[#30363d] dark:text-zinc-200 dark:border-zinc-600 border border-zinc-300 shadow-sm text-sm font-medium rounded-md transition-all active:scale-95 disabled:opacity-50">
                            {loadingEmail ? "Saving..." : "Update email"}
                        </button>
                    </form>
                 </div>

                 {/* Password Section */}
                 <div>
                    <h2 className="text-xl font-semibold mb-1">Change password</h2>
                    <p className="text-sm font-medium border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4 text-zinc-600 dark:text-zinc-400">
                        Ensure your account is using a long, random password to stay secure.
                    </p>
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="max-w-md space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">New password</label>
                                <input 
                                    type="password" 
                                    value={passForm.newPassword} 
                                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} 
                                    required 
                                    className="w-full bg-white dark:bg-[#0d1117] border border-zinc-300 dark:border-zinc-700/80 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Confirm new password</label>
                                <input 
                                    type="password" 
                                    value={passForm.confirmPassword} 
                                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} 
                                    required 
                                    className="w-full bg-white dark:bg-[#0d1117] border border-zinc-300 dark:border-zinc-700/80 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                        <button disabled={loadingPass} type="submit" className="px-4 py-1.5 bg-zinc-100 dark:bg-[#21262d] hover:bg-zinc-200 dark:hover:bg-[#30363d] dark:text-zinc-200 dark:border-zinc-600 border border-zinc-300 shadow-sm text-sm font-medium rounded-md transition-all active:scale-95 disabled:opacity-50">
                            {loadingPass ? "Updating..." : "Update password"}
                        </button>
                    </form>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
