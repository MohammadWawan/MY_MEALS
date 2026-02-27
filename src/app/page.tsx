"use client";

import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck, Clock } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-7xl px-6 pt-10 pb-16 lg:pt-20 relative flex flex-col lg:flex-row items-center gap-12">
         
         <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-400/30 bg-indigo-50/50 dark:bg-indigo-900/20 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mr-2 animate-pulse"></span>
              My Meals V2.0
            </div>
            
            <h1 className="max-w-4xl font-black text-5xl tracking-tight text-zinc-900 sm:text-7xl dark:text-white mb-8">
              Seamless Hospital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Catering & Orders</span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 mb-10 mx-auto lg:mx-0">
              Advanced point-of-sale system built specifically for healthcare facilities. Manage operating room advance orders, real-time kitchen tracking, and QRIS payments in one unified platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
               {mounted && user ? (
                  <Link href="/order" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group">
                    Order Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
               ) : (
                  <>
                     <Link href="/auth/login" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group">
                       Login to Dashboard
                       <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </Link>
                     <Link href="/auth/register" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-95">
                       Create an Account
                     </Link>
                  </>
               )}
            </div>
         </div>

         <div className="flex-1 relative w-full max-w-lg lg:max-w-xl z-10">
           <div className="relative w-full aspect-square">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 rounded-full filter blur-3xl animate-pulse"></div>
             <img 
                src="/assets/mascot.png" 
                alt="Hospital Waiter Mascot" 
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-serve hover:scale-105 transition-all duration-500 mix-blend-multiply dark:mix-blend-normal dark:bg-white/95 dark:p-6 dark:rounded-[3rem] dark:shadow-[0_0_50px_rgba(255,255,255,0.05)] dark:border dark:border-white/10"
             />
           </div>
         </div>
      </div>

      <div className="z-10 w-full max-w-7xl px-6 pb-20 relative">
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mx-auto text-left">
           <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                 <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Advance Ordering</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Schedule meals up to H-1 for operating rooms and specialized priority units.</p>
           </div>
           
           <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                 <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Real-time Kitchen</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">TV Dashboard monitoring from received orders to dispatch state dynamically.</p>
           </div>
           
           <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Secure QRIS</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Integrated QR payment and bank validations with receipt verification.</p>
           </div>
        </div>
      </div>
    </main>
  );
}
