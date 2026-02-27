"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { requestPasswordReset, resetPasswordWithToken } from "@/app/actions";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await requestPasswordReset(email);
      toast.success("Reset Token Generated! Check the box below.");
      setGeneratedToken(res.token);
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await resetPasswordWithToken(token, newPassword);
      toast.success("Password updated successfully!");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired token");
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {token ? "Set New Password" : "Reset password"}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {token ? "Enter your new password below" : "Enter your email and we'll generate a reset token."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-100 dark:border-zinc-800">
          {generatedToken && (
             <div className="mb-6 p-4 rounded-xl border border-indigo-200 bg-indigo-50 break-words flex flex-col items-center">
                 <p className="text-xs font-bold text-indigo-700 mb-2">Simulated Email Inbox Token:</p>
                 <code className="text-indigo-900 font-mono text-sm mb-3 text-center">{generatedToken}</code>
                 <Link href={`/auth/reset-password?token=${generatedToken}`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    Use Token to Reset
                 </Link>
             </div>
          )}

          {!token ? (
            <form className="space-y-6" onSubmit={handleRequest}>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email address</label>
                <div className="mt-2">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all" />
                </div>
              </div>
              <button type="submit" className="flex w-full justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3 py-4 text-sm font-bold text-white dark:text-zinc-900 shadow-lg hover:opacity-90 transition-all active:scale-[0.98]">
                Generate Reset Link
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">New Password</label>
                <div className="mt-2">
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all" />
                </div>
              </div>
              <button type="submit" className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-4 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98]">
                Save New Password
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm">
            <Link href="/auth/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors flex justify-center items-center gap-2">
              <span>&larr;</span> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}


