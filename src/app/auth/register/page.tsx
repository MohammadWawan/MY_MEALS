"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/app/actions";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validations = {
    length: password.length >= 5,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
        toast.error("Please meet all password requirements.");
        return;
    }
    if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }
    try {
      await registerUser({ name, email, password });
      toast.success("Registration successful! Please sign in.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Join Meals Apps untuk order makanan di Rumah Sakit lebih mudah.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-100 dark:border-zinc-800">
          <form className="space-y-5" onSubmit={handleRegister}>
             <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                  placeholder="Isi nama lengkap"
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
                  placeholder="anonim@mail.com"
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

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.98] mt-2"
              >
                Sign up
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Sign in Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
