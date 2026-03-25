"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/app/actions";
import { toast } from "sonner";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Memproses permintaan...");

    try {
      const result = await requestPasswordReset(email);
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("Link reset password telah dikirim ke email.");
        setIsFinished(true);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Masukkan email Anda untuk mendapatkan link pergantian password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-100 dark:border-zinc-800">
          {!isFinished ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Email address
                </label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3 pl-12 pr-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                    placeholder="nama@rs.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Memproses..." : "Kirim Link Reset"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Send className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Email Terkirim!</h3>
                <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-400">
                  Instruksi pemulihan kata sandi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
                </p>
              </div>
              
              <button 
                onClick={() => setIsFinished(false)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              >
                Coba email lain
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
