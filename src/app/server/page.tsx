"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Truck, MapPin, Search, Calendar, Filter, User, CheckCircle, Navigation, Info, Clock, History, Camera, X, Loader2 } from "lucide-react";
import { getPendingOrders, updateOrderStatus } from "@/app/actions";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WaiterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);
  const [lastReadyCount, setLastReadyCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders();
      setOrders(data.map(dbOrder => ({
        id: dbOrder.id,
        status: dbOrder.status,
        customerName: dbOrder.user?.name || 'Unknown',
        floor: dbOrder.floor,
        location: dbOrder.location,
        roomNumber: dbOrder.roomNumber,
        description: dbOrder.description,
        orderDate: dbOrder.orderDate,
        orderType: dbOrder.orderType,
        deliveryProofUrl: dbOrder.deliveryProofUrl,
        items: dbOrder.orderItems.map((oi: any) => `${oi.quantity}x ${oi.productName}`),
      })));
    } catch(e) {
      console.error("Failed to load orders");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    const readyCount = orders.filter(o => o.status === 'ready').length;
    if (readyCount > lastReadyCount && audioEnabled) {
       const audio = new Audio('/tingtung.mp3');
       audio.play().catch(e => {
          if (e.name === 'NotAllowedError') {
             setAudioEnabled(false);
             toast.error("Audio diblokir. Aktifkan kembali.");
          }
       });
    }
    setLastReadyCount(readyCount);
  }, [orders, lastReadyCount, audioEnabled]);

  // Strict Role Control
  useEffect(() => {
    if (mounted && user && user.role !== 'waiter' && user.role !== 'admin') {
       toast.error("Access denied. Redirecting...");
       router.push("/");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) return null;

  const handleUpdateStatus = async (id: string, nextStatus: string, proofUrl?: string) => {
    try {
      await updateOrderStatus(id, nextStatus, undefined, proofUrl);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus, deliveryProofUrl: proofUrl || o.deliveryProofUrl } : o));
      toast.success(`Order ${id} status updated to ${nextStatus}`);
    } catch (e) {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleUploadClick = (id: string) => {
    setUploadingId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await handleUpdateStatus(uploadingId, 'delivered', base64String);
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  // BACK-DATE: Show all records by default sorted by Date DESC
  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchQuery === "" || 
       o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
       o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Point 2: Hide if delivered/complete and older than today
    const orderDateStr = new Date(o.orderDate).toISOString().split('T')[0];
    const isToday = orderDateStr === new Date().toISOString().split('T')[0];
    const isFinalStatus = ['delivered'].includes(o.status);

    const matchesDate = dateFilter 
      ? orderDateStr === dateFilter 
      : (isToday || !isFinalStatus);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      <div className="max-w-7xl mx-auto mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
           <div>
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                 <Truck className="text-indigo-600 w-10 h-10" /> Pramusaji Hub
              </h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic">Delivery Station Board • Photo Proof Required</p>
              <button 
                onClick={() => {
                  setAudioEnabled(true);
                  const a = new Audio('/tingtung.mp3');
                  a.play().catch(() => {});
                  toast.success("Notifikasi suara aktif");
                }} 
                className={`mt-3 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${audioEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 animate-bounce'}`}
              >
                {audioEnabled ? '🔊 Notifikasi Aktif' : '🔇 Aktifkan Suara'}
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input type="text" placeholder="Cari pemesan/ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
              </div>
              <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer">
                 <option value="all">Semua Status</option>
                 <option value="ready">Ready (Siap Kirim)</option>
                 <option value="delivering">In Delivery</option>
                 <option value="delivered">Delivered (Selesai)</option>
              </select>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
         {filteredOrders.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <Navigation className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
               <p className="text-zinc-400 font-bold text-xl uppercase tracking-widest">No Deliveries Found</p>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrders.map(order => (
               <div key={order.id} className={`bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col transition-all hover:shadow-2xl ${order.status === 'delivered' ? 'border-emerald-200 dark:border-emerald-900/30' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'ready' ? 'bg-amber-100 text-amber-700' : 
                        order.status === 'delivering' ? 'bg-indigo-100 text-indigo-700' : 
                        'bg-emerald-100 text-emerald-700'
                     }`}>
                        {order.status === 'ready' ? 'Siap Kirim' : order.status === 'delivering' ? 'Dalam Perjalanan' : 'Terkirim'}
                     </span>
                     <span className="font-mono text-[9px] font-black text-zinc-400 uppercase tracking-tighter">{order.id}</span>
                  </div>

                  <div className="mb-8 flex items-center gap-4">
                     <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-[1.25rem] flex items-center justify-center text-indigo-600 shrink-0">
                        <User className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest mb-1">Penerima</p>
                        <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 uppercase">{order.customerName}</h3>
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-3">
                           <MapPin className="w-4 h-4 text-rose-500" />
                           <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Target Lokasi: {order.floor}</span>
                        </div>
                        <p className="text-zinc-500 text-xs font-bold pl-7 leading-relaxed uppercase">{order.location || 'Detail lokasi tidak disebutkan'} {order.roomNumber ? `(Kamar: ${order.roomNumber})` : ''}</p>
                        {order.description && (
                          <div className="mt-3 pl-7 border-l-2 border-indigo-500">
                             <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Catatan Tambahan:</p>
                             <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">{order.description}</p>
                          </div>
                        )}
                     </div>
                     <div className="pl-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Jam Order: {new Date(order.orderDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        <ul className="text-xs font-bold text-zinc-500 space-y-1 mt-3">
                           {order.items.map((it: string, idx: number) => <li key={idx} className="flex gap-2 items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>{it}</li>)}
                        </ul>
                     </div>
                  </div>

                  {order.deliveryProofUrl && (
                     <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 aspect-video relative cursor-pointer group" onClick={() => setFullPhoto(order.deliveryProofUrl)}>
                        <Image src={order.deliveryProofUrl} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Info className="text-white" /></div>
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle className="w-4 h-4" /></div>
                     </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
                     {order.status === 'ready' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'delivering')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95">
                           Terima & Kirim Sekarang
                        </button>
                     )}
                     {order.status === 'delivering' && (
                        <button 
                          onClick={() => handleUploadClick(order.id)} 
                          disabled={uploadingId === order.id}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                           {uploadingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                           {uploadingId === order.id ? 'Memproses...' : 'Foto & Tandai Selesai'}
                        </button>
                     )}
                     {order.status === 'delivered' && (
                        <div className="text-center text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 py-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                           <CheckCircle className="w-4 h-4" /> Pesanan Sudah Sampai
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>

       {/* Full Photo Modal */}
       {fullPhoto && (
         <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 md:p-20" onClick={() => setFullPhoto(null)}>
            <button className="absolute top-6 right-6 text-white p-4 hover:bg-white/10 rounded-full"><X className="w-8 h-8" /></button>
            <Image src={fullPhoto} alt="Full delivery proof" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-zinc-800" />
         </div>
       )}
    </div>
  );
}
