"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Printer, XCircle, Search, Calendar, Banknote, User, CheckCircle, Clock, MapPin, Hash, ShieldCheck, Heart, Trash2, CreditCard, ScanLine, QrCode } from "lucide-react";
import { getPendingOrders, updateOrderStatus, deleteOrder, sendBillEmail } from "@/app/actions";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";


export default function CashierDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedId, setScannedId] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const lastOrderCountRef = useRef(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const initializedRef = useRef(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders();
      setOrders(data.map(dbOrder => ({
        ...dbOrder,
        userType: dbOrder.orderType === 'doctor' ? 'doctor' : 'customer',
        amount: dbOrder.totalAmount,
        orderDate: dbOrder.orderDate,
        mrn: dbOrder.mrn,
        floor: dbOrder.floor,
        location: dbOrder.location,
        customerName: dbOrder.user?.name || 'Unknown',
        employeeId: dbOrder.user?.employeeId || null,
        items: dbOrder.orderItems.map((oi: any) => ({
          name: oi.productName,
          qty: oi.quantity,
          price: oi.price
        })),
        paymentMethod: dbOrder.paymentMethod
      })));
    } catch(e) {
      console.error("Failed to load orders", e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadOrders();
    const interval = setInterval(loadOrders, 3000); 
    
    // Auto-prime audio on first interaction
    const primeAudio = () => {
      const a = new Audio('/tingtung.mp3');
      a.play().catch(() => {});
      window.removeEventListener('click', primeAudio);
    };
    window.addEventListener('click', primeAudio);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', primeAudio);
    };
  }, [loadOrders]);

  useEffect(() => {
    // Exclude 'tunai' from pending notifications since they must be scanned first
    const pendingCount = orders.filter(o => o.status === 'received' && o.paymentMethod !== 'tunai' && o.paymentMethod !== 'cash').length;
    
    // Only play sound if already initialized (prevents sound on first load)
    if (initializedRef.current && pendingCount > lastOrderCountRef.current && audioEnabled) {
       const audio = new Audio('/tingtung.mp3');
       audio.play().catch(e => {
          console.error("Audio play failed", e);
       });
    }
    
    lastOrderCountRef.current = pendingCount;
    if (orders.length > 0) initializedRef.current = true;
  }, [orders, audioEnabled]);

  // Strict Role Protection
  useEffect(() => {
    if (mounted && user && user.role !== 'cashier' && user.role !== 'admin') {
       toast.error("Unauthorized! Redirecting...");
       router.push("/");
    }
  }, [mounted, user, router]);


  if (!mounted || !user) return null;

  const validatePayment = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading("Memvalidasi pembayaran...");
    try {
      await updateOrderStatus(id, "created", true, undefined, undefined, user?.name, undefined, undefined, user?.id);
      
      // Point 3: Auto-send bill email
      try {
         await sendBillEmail(id);
      } catch(emailErr) {
         console.error("Email bill failed", emailErr);
      }

      setOrders(prev => prev.map(o => o.id === id ? { ...o, isPaid: true, status: "created" } : o));
      toast.dismiss(loadingToast);
      toast.success("Pembayaran valid! Bill telah dikirim ke email customer.");
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error("Gagal memvalidasi pembayaran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (order: any) => {
    const reason = prompt("Masukkan alasan pembatalan:");
    if (reason === null) return; // User cancelled prompt

    let refundCash = false;
    if (order.isPaid) {
      refundCash = confirm("Pesanan ini sudah dibayar. Apakah Anda telah mengembalikan uang secara TUNAI kepada customer?");
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading("Membatalkan pesanan...");
    try {
      await updateOrderStatus(order.id, "cancelled", false, undefined, reason, user?.name, refundCash, refundCash ? "cash" : undefined);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "cancelled", isPaid: false, isRefunded: refundCash } : o));
      toast.dismiss(loadingToast);
      toast.warning(refundCash ? "Pesanan dibatalkan & uang dikembalikan secara tunai." : "Pesanan berhasil dibatalkan.");
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error("Gagal membatalkan pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmDelete = confirm("Hapus permanen pesanan ini dari sistem?");
    if (confirmDelete) {
      try {
        await deleteOrder(id);
        setOrders(prev => prev.filter(o => o.id !== id));
        toast.error("Pesanan dihapus permanen.");
      } catch (e) {
        toast.error("Gagal menghapus pesanan.");
      }
    }
  };

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
       window.print();
    }, 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const filteredOrders = orders.filter(o => {

    const matchesSearch = searchQuery === "" || 
       o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (o.mrn && o.mrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Point 3: Hide if validated/complete and older than today, unless dateFilter is active
    const orderDateStr = new Date(o.orderDate).toISOString().split('T')[0];
    const isToday = orderDateStr === new Date().toISOString().split('T')[0];
    const isFinalStatus = ['created', 'ready', 'delivered', 'cancelled'].includes(o.status);

    const matchesDate = dateFilter 
      ? orderDateStr === dateFilter 
      : (isToday || !isFinalStatus || searchQuery !== "");
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-[#f8fafc] dark:bg-[#020617] relative font-sans">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* Header & Filters */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-10">
          <div>
            <h1 className="text-5xl font-black mb-3 flex items-center gap-3 tracking-tighter text-zinc-900 dark:text-white">
              <Banknote className="text-emerald-500 w-12 h-12" /> Kasir Hub
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Validasi Pembayaran & Cetak Bill
            </p>
            <button 
               onClick={() => {
                  setAudioEnabled(true);
                  const a = new Audio('/tingtung.mp3');
                  a.play().catch(() => {}); // Prime the audio context
                  toast.success("Notifikasi suara diaktifkan");
               }} 
               className={`mt-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${audioEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 animate-bounce'}`}
            >
               {audioEnabled ? '🔊 Audio Notifikasi Aktif' : '🔇 Klik untuk Aktifkan Notifikasi Suara'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto mt-6 md:mt-0">
             <button onClick={() => router.push("/cashier/refunds")} className="px-6 py-4 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-rose-600 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all w-full md:w-auto whitespace-nowrap text-sm">
                 Approve Refund
             </button>
             <button onClick={() => { setShowScanner(true); setScannedId(""); }} className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm w-full md:w-auto whitespace-nowrap">
                <ScanLine className="w-5 h-5" /> SCAN QR
             </button>
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
               <input type="text" placeholder="ID / MRN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
             </div>
             <div className="relative">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
               <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
             </div>
             <button onClick={() => { setDateFilter(""); setSearchQuery(""); }} className="px-8 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 text-sm whitespace-nowrap">Reset Filter</button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20">
            <Search className="w-20 h-20 mb-4" />
            <p className="text-2xl font-black uppercase tracking-widest">Tidak ada data transaksi</p>
          </div>
        )}
        
        {filteredOrders.map(order => (
          <div key={order.id} className={`bg-white dark:bg-zinc-900/50 p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${order.status === 'cancelled' ? 'opacity-50' : ''}`}>
             
             {/* Order Identity */}
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-2xl font-black flex items-center gap-2 text-zinc-900 dark:text-white leading-none">
                      {order.id}
                   </h2>
                   <div className="flex gap-2 mt-3">
                      <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${order.orderType === 'doctor' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                         {order.orderType === 'doctor' ? 'DOKTER' : 'PASIEN'}
                      </span>
                      {order.isPaid && <span className="bg-blue-500 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full">LUNAS</span>}
                      {order.status === 'cancelled' && <span className="bg-rose-500 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full">BATAL</span>}
                       {order.isRefunded && <span className="bg-emerald-500 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full">REFUND TUNAI</span>}
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   {order.isPaid ? <ShieldCheck className="text-emerald-500 w-8 h-8" /> : <Clock className="text-amber-500 w-8 h-8 animate-pulse" />}
                   <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
             </div>
             
             {/* Content */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                   <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <User className="text-zinc-500" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nama Pemesan</p>
                      <p className="font-black text-lg text-zinc-800 dark:text-zinc-100 uppercase truncate max-w-[180px]">{order.customerName}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {order.orderType !== 'doctor' && (
                     <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> MRN</p>
                        <p className="font-black text-sm text-zinc-800 dark:text-zinc-100">{order.mrn || "—"}</p>
                     </div>
                   )}
                    <div className={`${order.orderType === 'doctor' ? 'col-span-2' : 'col-span-1'} bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800`}>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Lokasi</p>
                      <p className="font-black text-xs text-zinc-800 dark:text-zinc-100 truncate">{order.floor} {order.location ? `– ${order.location}` : ''} {order.roomNumber ? `(Kamar: ${order.roomNumber})` : ''}</p>
                   </div>
                </div>

                {order.description && (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                     <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Catatan Tambahan:</p>
                     <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{order.description}</p>
                  </div>
                )}

                <div className="py-2">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Total Transaksi</p>
                   <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                      {order.orderType === 'doctor' ? "FREE" : formatPrice(order.amount)}
                   </p>
                </div>
             </div>
             
             {/* Image Preview */}
             {order.receiptImageUrl && !order.isPaid && (
               <div className="mt-8 group relative overflow-hidden rounded-3xl cursor-pointer shadow-lg border-4 border-white dark:border-zinc-800" onClick={() => setFullImage(order.receiptImageUrl)}>
                 <img src={order.receiptImageUrl} alt="Receipt" className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-black text-xs uppercase tracking-widest">Klik Perbesar</p>
                 </div>
               </div>
             )}

             {/* Actions */}
             <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                {order.status !== 'cancelled' && !order.isPaid ? (
                  <>
                    <button disabled={isSubmitting} onClick={() => handleCancelOrder(order)} className="p-5 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-3xl hover:bg-rose-100 transition-all disabled:opacity-50" title="Batalkan Pesanan">
                       <XCircle className="w-6 h-6" />
                    </button>
                    <button disabled={isSubmitting} onClick={() => validatePayment(order.id)} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[1.5rem] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50">
                       {isSubmitting ? "Memproses..." : "Verifikasi"}
                    </button>
                  </>
                ) : (
                 order.status !== 'cancelled' && (
                   <button onClick={() => handlePrint(order)} className="flex items-center justify-center gap-3 w-full py-5 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white font-black rounded-[1.5rem] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest">
                     <Printer className="w-5 h-5" /> Cetak Bill
                   </button>
                 )
               )}
               
               {order.status === 'cancelled' && (
                  <div className="w-full flex flex-col gap-2">
                     <div className="w-full py-4 text-center text-rose-500 font-bold text-xs uppercase italic bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
                        Pesanan dibatalkan
                     </div>
                     {order.cancelReason && (
                       <div className="px-4 text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                         Alasan: {order.cancelReason}
                       </div>
                     )}
                  </div>
               )}
             </div>
          </div>
        ))}
      </div>

      {/* Footer SIMRS */}
      <footer className="max-w-7xl mx-auto py-12 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-2 opacity-50">
         <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">SIMRS - HERMINA PASURUAN</p>
         <p className="text-[10px] font-bold text-zinc-400">COPYRIGHT &copy; 2026 • HOSPITAL POS INTEGRATED SYSTEM</p>
      </footer>

      {/* Image Viewer Modal */}
      {fullImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-8 md:p-12 print:hidden backdrop-blur-2xl" onClick={() => setFullImage(null)}>
            <button className="absolute top-8 right-8 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all" onClick={() => setFullImage(null)}><XCircle /></button>
            <img src={fullImage} className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800" alt="Full Receipt" />
        </div>
      )}

      {/* Hardware QR/Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col relative">
              <button 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" 
                onClick={() => { setShowScanner(false); setScannedId(""); }}
              >
                 <XCircle className="w-6 h-6 text-zinc-500" />
              </button>

              <div className="text-center mb-10">
                 <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                    <ScanLine className="w-8 h-8" />
                 </div>
                 <h2 className="text-3xl font-black tracking-tighter">Scan QR Code Customer</h2>
                 <p className="text-zinc-500 text-sm font-medium mt-1">Gunakan alat Scanner (Barcode Gun) untuk memindai QR code</p>
              </div>
              
              {!orders.find(o => o.id === scannedId.trim() && !['cancelled', 'delivered'].includes(o.status)) ? (
                <div className="flex flex-col items-center">
                   <div className="w-full relative mb-8">
                      <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-300" />
                      <input 
                         autoFocus
                         type="text" 
                         value={scannedId} 
                         onChange={(e) => setScannedId(e.target.value.toUpperCase())} 
                         placeholder="Awaiting scan result..." 
                         className="w-full text-2xl font-black bg-zinc-50 dark:bg-zinc-950 border-4 border-zinc-200 dark:border-zinc-800 rounded-[2rem] py-8 pl-20 pr-8 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all uppercase tracking-widest shadow-inner text-center"
                      />
                   </div>
                   
                   <div className="w-full py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/20">
                      <div className="w-12 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-bounce mb-4"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Silakan tembak QR Code dengan alat scanner</p>
                   </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-8 duration-500">
                   {(() => {
                      const foundOrder = orders.find(o => o.id === scannedId.trim() && !['cancelled', 'delivered'].includes(o.status));
                      if (foundOrder) return (
                         <div className="bg-emerald-50 dark:bg-emerald-900/10 border-4 border-emerald-200 dark:border-emerald-900/50 p-8 rounded-[2.5rem] shadow-xl">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-emerald-100 dark:border-emerald-900/30">
                               <div>
                                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Pesanan Ditemukan</p>
                                  <p className="text-3xl font-black text-emerald-950 dark:text-emerald-50 leading-tight">{foundOrder.id}</p>
                                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-2"><User className="w-4 h-4" /> {foundOrder.customerName}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest mb-1">Total</p>
                                  <p className="text-3xl font-black text-emerald-600">{formatPrice(foundOrder.amount)}</p>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <button 
                                 onClick={() => { setShowScanner(false); setScannedId(""); }} 
                                 className="py-5 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-50 transition-all text-sm"
                               >
                                  Tutup
                               </button>
                               <button 
                                 disabled={isSubmitting || foundOrder.isPaid} 
                                 onClick={() => {
                                   validatePayment(foundOrder.id);
                                   setShowScanner(false);
                                   setScannedId("");
                                 }} 
                                 className="py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 flex justify-center items-center gap-2"
                               >
                                  <CheckCircle className="w-5 h-5" /> Validasi
                               </button>
                            </div>
                         </div>
                      );
                   })()}
                </div>
              )}
           </div>
        </div>
      )}

      {printOrder && (
        <div className="print-container hidden print:block bg-white text-black font-sans leading-tight">
           <div className="w-[80mm] mx-auto p-2 bg-white">
              {/* Receipt Header */}
              <div className="text-center mb-6 space-y-1">
                 <div className="flex justify-center mb-2">
                    <img src="/hermina_logo.png" alt="Hermina Logo" className="w-12 h-12 grayscale brightness-0" onError={(e) => e.currentTarget.style.display='none'} />
                 </div>
                 <h1 className="text-lg font-black leading-tight">RS HERMINA PASURUAN</h1>
                 <p className="text-[10px] font-bold">Jl. Ir. H. Juanda No.92, Pasuruan</p>
                 <p className="text-[10px] font-medium leading-none">Telp: (0343) 4509999</p>
              </div>

              <div className="border-t border-b border-black border-dashed py-3 mb-4 space-y-1">
                 <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                    <span>Order ID:</span>
                    <span>{printOrder.id}</span>
                 </div>
                 <div className="flex justify-between text-[11px]">
                    <span>Waktu:</span>
                    <span>{new Date(printOrder.orderDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                 </div>
                 <div className="flex justify-between text-[11px]">
                    <span>Kasir:</span>
                    <span>{user.name}</span>
                 </div>
              </div>

              <div className="mb-4 space-y-0.5">
                 <div className="flex justify-between text-[11px] font-black uppercase">
                    <span>Penerima:</span>
                    <span className="text-right">{printOrder.customerName}</span>
                 </div>
                  <div className="flex justify-between text-[10px] font-bold">
                     <span>Lokasi:</span>
                     <span className="text-right">{printOrder.floor} - {printOrder.location} {printOrder.roomNumber ? `(R.${printOrder.roomNumber})` : ''}</span>
                  </div>
                  {printOrder.mrn && printOrder.userType !== 'doctor' && (
                    <div className="flex justify-between text-[10px]">
                       <span>MRN:</span>
                       <span className="font-mono">{printOrder.mrn}</span>
                    </div>
                  )}
                  {printOrder.description && (
                    <div className="text-[10px] border-t border-zinc-100 pt-1 mt-1">
                       <span className="font-black uppercase text-[8px] text-zinc-400">Catatan:</span>
                       <p className="font-bold">{printOrder.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                     <span>Metode:</span>
                     <span className="uppercase">{printOrder.paymentMethod || "CASH"}</span>
                  </div>
              </div>

              <table className="w-full text-[11px] mb-6 border-collapse">
                 <thead>
                    <tr className="border-b border-black">
                       <th className="text-left py-2 font-black uppercase text-[10px]">Item Pesanan</th>
                       <th className="text-right py-2 font-black uppercase text-[10px]">Qty</th>
                       <th className="text-right py-2 font-black uppercase text-[10px]">Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-200 divide-dashed">
                    {printOrder.items.map((it: any, i: number) => (
                       <tr key={i} className="align-top">
                          <td className="py-2 pr-2 font-bold leading-tight">{it.name}</td>
                          <td className="text-right py-2">x{it.qty}</td>
                          <td className="text-right py-2">{formatPrice(it.price * it.qty).replace("Rp", "").trim()}</td>
                       </tr>
                    ))}
                 </tbody>
                 <tfoot>
                    <tr className="border-t-2 border-black border-double">
                       <td colSpan={2} className="pt-4 font-black">TOTAL AKHIR</td>
                       <td className="pt-4 text-right font-black text-sm">{formatPrice(printOrder.amount)}</td>
                    </tr>
                 </tfoot>
              </table>

              <div className="text-center space-y-3 mt-8">
                 <div className="bg-zinc-100 p-2 rounded-lg inline-block px-6">
                    <p className="text-[12px] font-black tracking-widest leading-none">LUNAS / PAID</p>
                 </div>
                 <div className="text-[9px] font-bold italic space-y-1 mt-4">
                    <p>Terima kasih atas pesanan Anda.</p>
                    <p>Semoga lekas sembuh.</p>
                 </div>
                 
                 <div className="pt-6 mt-6 border-t border-zinc-100 space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">SIMRS - HERMINA PASURUAN</p>
                    <p className="text-[7px] font-bold text-zinc-300">SYSTEM GENERATED INVOICE 2026</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
