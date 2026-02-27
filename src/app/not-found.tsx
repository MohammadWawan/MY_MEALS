import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 dark:bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="z-10 bg-white dark:bg-zinc-900/80 p-12 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm max-w-lg w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-6xl font-black text-zinc-900 dark:text-zinc-50 mb-4 tracking-tighter">503</h1>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">System Maintenance</h2>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
          Mohon maaf, sistem My Meals saat ini sedang dalam perbaikan atau down sementara waktu. Silakan kembali lagi nanti.
        </p>
        
        <Link 
          href="/" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
        >
          Coba Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
