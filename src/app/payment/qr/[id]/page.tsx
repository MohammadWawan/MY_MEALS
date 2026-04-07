"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions";

export default function CashQRPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params?.id;
  const [countdown, setCountdown] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && countdown > 0) {
      interval = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && isTimerActive) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, countdown]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-black mb-6 text-center mt-4 tracking-tighter">KODE PEMBAYARAN</h2>
        
        <div className="flex flex-col items-center text-center">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Tunjukkan QR Code ini ke Kasir</p>
            <div className="w-56 h-56 bg-zinc-50 dark:bg-zinc-950 border-4 border-emerald-100 dark:border-emerald-900/40 rounded-3xl flex items-center justify-center shadow-inner mb-6 relative hover:scale-105 transition-transform duration-300 group">
              {countdown > 0 ? (
                  <QrCode className="w-32 h-32 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <QrCode className="w-16 h-16 mb-2" />
                    <span className="text-xs font-black uppercase">Expired</span>
                  </div>
              )}
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Order ID</p>
            <p className="font-mono font-bold tracking-widest mb-6 text-xl">{id}</p>
            
            <div className="text-4xl font-black mb-2 text-zinc-900 dark:text-zinc-100 tracking-tighter">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-zinc-400 mb-8">Batas waktu pembayaran untuk pesanan ini.</p>

            {countdown === 0 ? (
              <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => { setCountdown(300); setIsTimerActive(true); }} className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-colors uppercase text-sm tracking-widest shadow-xl">
                    Generate Ulang QR
                  </button>
                  <button onClick={async () => {
                      toast.loading("Membatalkan...", { id: "cancel" });
                      await updateOrderStatus(id, "cancelled", undefined, undefined, "Dibatalkan Pelanggan (QR Kedaluwarsa)", undefined, true, "cash");
                      toast.success("Pesanan dibatalkan.", { id: "cancel" });
                      router.replace("/");
                  }} className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-rose-600 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    Batal Order
                  </button>
              </div>
            ) : (
              <button onClick={() => router.replace("/tracking")} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg active:scale-95">
                  Tutup & Lanjut ke Status Pesanan
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
