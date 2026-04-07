"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getPendingOrders, sendRefundEmail } from "@/app/actions";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, UploadCloud, Copy, Send, CheckCircle, Info } from "lucide-react";

export default function CashierRefunds() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [proofImage, setProofImage] = useState<string | null>(null);
    
    const { user } = useAuth();
    const router = useRouter();

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const data = await getPendingOrders();
            // Filter: cancelled orders that are refunded via non-cash methods
            const allRefunds = data.filter(o => 
                o.status === 'cancelled' && 
                o.isRefunded && 
                o.refundMethod && 
                o.refundMethod !== 'cash'
            );
            setOrders(allRefunds);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'cashier' && user.role !== 'admin') {
            router.push("/");
            return;
        }
        fetchRefunds();
    }, [user, router]);

    const handleUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Cek ukuran max 5MB
        if (file.size > 5 * 1024 * 1024) {
             toast.error("Gambar terlalu besar! Maksimal 5MB.");
             return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setProofImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSendRefund = async () => {
        if (!selectedOrder) return;
        if (!proofImage) return toast.error("Silakan unggah bukti transfer rekening bank terlebih dahulu.");
        
        const customerEmail = selectedOrder.user?.email;
        if (!customerEmail) {
             return toast.error("Customer tidak memiliki email yang terdaftar!");
        }

        setIsSubmitting(true);
        toast.loading("Mengirim email ke customer...", { id: "refund" });
        
        try {
            const res = await sendRefundEmail(customerEmail, selectedOrder.id, proofImage, selectedOrder.refundMethod);
            if (res.success) {
                toast.success("Email bukti transfer refund berhasil dikirim!", { id: "refund" });
                setProofImage(null);
                setSelectedOrder(null);
                fetchRefunds();
            } else {
                toast.error(res.error || "Gagal mengirim email.", { id: "refund" });
            }
        } catch(e) {
            toast.error("Terjadi kesalahan sistem pengiriman email.", { id: "refund" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const pendingCount = orders.filter(o => !o.deliveryProofUrl).length;

    return (
        <div className="min-h-screen p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950 font-sans">
            <div className="max-w-6xl mx-auto">
                
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/cashier")} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-zinc-500" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Request Refund Transfer</h1>
                            <p className="text-zinc-500 text-sm font-medium mt-1">Selesaikan antrean pembatalan dengan melakukan transfer kembali ke rekening di bawah ini.</p>
                        </div>
                    </div>
                    <button onClick={fetchRefunds} className="flex px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 font-bold text-sm items-center gap-2 transition-all">
                       <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-400" /></div>
                    ) : orders.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <Info className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                            <h3 className="text-xl font-bold text-zinc-500">Tidak ada antrean refund.</h3>
                            <p className="text-zinc-400 mt-2">Semua transaksi dana telah selesai diselesaikan.</p>
                        </div>
                    ) : (
                        orders.map((o) => {
                            const isCompleted = o.deliveryProofUrl && o.updatedAt; // we marked deliveryProofUrl as proof
                            return (
                                <div key={o.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl relative transition-all ${isCompleted ? 'border-emerald-200 dark:border-emerald-900/40 opacity-70' : 'border-zinc-200 dark:border-zinc-800 hover:-translate-y-1'}`}>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="font-black text-xl tracking-tighter">{o.id}</p>
                                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-full tracking-widest ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {isCompleted ? 'Refund Selesai' : 'Perlu Transfer'}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-1">Total Dana Terdampak</p>
                                            <p className="text-2xl font-black text-emerald-600 leading-none">Rp {o.totalAmount.toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                                            <p className="text-[10px] text-amber-700 dark:text-amber-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2">Detail Rekening Tujuan</p>
                                            <p className="text-sm font-bold text-zinc-800 dark:text-amber-100 break-words">{o.refundMethod}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-1">Email Customer</p>
                                            <p className="text-xs font-bold text-zinc-600 truncate">{o.user?.email || "Tidak Ada Email"}</p>
                                        </div>
                                    </div>

                                    {isCompleted ? (
                                        <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/30 text-center">
                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-2 justify-center"><CheckCircle className="w-4 h-4" /> BUKTI TERKIRIM</p>
                                            <p className="text-[9px] text-zinc-400 mt-1">{new Date(o.updatedAt).toLocaleString('id-ID')}</p>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setSelectedOrder(o); setProofImage(null); }} className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest border border-transparent">
                                            Proses Transfer
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal Detail & Email Sender */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        
                        <div className="flex justify-between items-start mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                            <div>
                                <h2 className="text-2xl font-black mb-1 text-slate-800 dark:text-zinc-100">Kirim Bukti Refund</h2>
                                <p className="text-sm font-bold text-zinc-500">Order ID: {selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-zinc-400 hover:text-rose-500 font-bold text-xl transition-colors">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                           <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                               <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-1">Email Customer</p>
                               <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 text-sm font-medium items-center text-zinc-600 truncate">
                                   {selectedOrder.user?.email || "Email hilang!"}
                               </div>
                           </div>
                           <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-100 dark:border-blue-900">
                               <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">Target Nominal</p>
                               <div className="text-2xl font-black text-blue-700 dark:text-blue-400 truncate">
                                   Rp {selectedOrder.totalAmount.toLocaleString()}
                               </div>
                           </div>
                        </div>

                        <div className="mb-8">
                             <div className="p-4 rounded-xl font-bold bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-500 mb-6 flex justify-between items-center text-sm">
                                 <span>{selectedOrder.refundMethod}</span>
                                 <button onClick={() => {
                                     navigator.clipboard.writeText(selectedOrder.refundMethod);
                                     toast.info("Disalin ke clipboard!");
                                 }} className="p-2 bg-white/50 hover:bg-white rounded-lg shadow-sm" title="Salin Teks"><Copy className="w-4 h-4" /></button>
                             </div>

                            {!proofImage ? (
                                <label className="flex flex-col items-center justify-center w-full h-48 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-[2rem] cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 text-indigo-500" /></div>
                                        <p className="mb-2 text-sm text-zinc-500 font-bold"><span className="text-indigo-500">Klik mengunggah</span> bukti mutasi / transfer</p>
                                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </label>
                            ) : (
                                <div className="relative">
                                    <img src={proofImage} alt="Bukti Transfer" className="w-full h-48 object-cover rounded-[2rem] shadow-inner border border-zinc-200 dark:border-zinc-800" />
                                    <button onClick={() => setProofImage(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border border-white/20 p-2 rounded-xl text-xs font-bold hover:bg-black transition-colors">Ganti Foto</button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                             <button type="button" onClick={() => setSelectedOrder(null)} className="w-1/3 py-4 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-2xl text-sm transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">Cancel</button>
                             <button 
                                disabled={isSubmitting || !proofImage} 
                                onClick={handleSendRefund}
                                className="w-2/3 py-4 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                             >
                                 <Send className="w-4 h-4" /> {isSubmitting ? "Mengirim Email..." : "Upload & Kirim via Email"}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
