"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, Clock, ChefHat, Truck, MapPin, Star, RefreshCw, ChevronRight, Search, Calendar, History, Package } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getMyOrders, rateMenu } from "@/app/actions";
import { toast } from "sonner";

export default function TrackingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Rating states
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [editingRating, setEditingRating] = useState(false);
  
  const prevOrdersRef = useRef<string>("");

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMyOrders(user.id);
      const dataString = JSON.stringify(data.map(o => ({id: o.id, status: o.status})));
      if (dataString !== prevOrdersRef.current) {
         setOrders(data);
         if (!activeOrderId && data.length > 0) setActiveOrderId(data[0].id);
         prevOrdersRef.current = dataString;
      }
      setLoading(false);
    } catch (e) {
      console.error("Fetch orders failed", e);
    }
  }, [user?.id, activeOrderId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000); 
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const currentOrder = orders.find(o => o.id === activeOrderId);

  // BACK-DATE & SEARCH: Filter history by date and food item name
  const filteredOrders = orders.filter(o => {
     const matchesFood = !searchQuery || o.orderItems.some((oi: any) => oi.productName.toLowerCase().includes(searchQuery.toLowerCase()));
     
     // Point 4 & 5: Hide if delivered and older than today, unless dateFilter is active
     const orderDateStr = new Date(o.orderDate).toISOString().split('T')[0];
     const isToday = orderDateStr === new Date().toISOString().split('T')[0];
     const isFinalStatus = ['delivered', 'cancelled'].includes(o.status);

     const matchesDate = dateFilter 
       ? orderDateStr === dateFilter 
       : (isToday || !isFinalStatus);

     return matchesDate && matchesFood;
  });

  const getStatusNumber = (status: string) => {
    switch(status) {
      case "received": return 1;
      case "created": return 2;
      case "preparing": return 3;
      case "ready": return 4;
      case "delivering": return 5;
      case "delivered": return 6;
      case "cancelled": return -1;
      case "pending-approval": return 0;
      default: return 0;
    }
  };

  const steps = [
    { n: 1, label: "Order Received", icon: Clock, desc: "Wait for validation" },
    { n: 2, label: "Validated", icon: CheckCircle, desc: "Order sent to kitchen" },
    { n: 3, label: "Preparing", icon: ChefHat, desc: "Chef is cooking" },
    { n: 4, label: "Ready", icon: Package, desc: "Waiting for delivery" },
    { n: 5, label: "Out for Delivery", icon: Truck, desc: "Courier on the way" },
    { n: 6, label: "Delivered", icon: MapPin, desc: "Order arrived!" }
  ];

  const currentStatusNum = currentOrder ? getStatusNumber(currentOrder.status) : 0;

  const handleRate = async () => {
    if (rating === 0) return toast.error("Please select a star rating!");
    setIsSubmittingRating(true);
    try {
      const menuId = currentOrder?.orderItems[0]?.productId; 
      if (menuId && activeOrderId) {
        await rateMenu(activeOrderId, menuId, rating, reviewText, editingRating ? (currentOrder.submittedRating || 0) : undefined);
        toast.success("Thank you for your rating!");
        setEditingRating(false);
        setOrders(prev => prev.map(o => o.id === activeOrderId ? { ...o, submittedRating: rating, reviewText: reviewText } : o));
      }
    } catch (e) {
      toast.error("Failed to submit rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
       <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 pb-40">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Left Sidebar: Detailed History with Search/Date Filter */}
        <div className="w-full lg:w-1/3 space-y-8">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-indigo-500/5">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <History className="text-indigo-600" /> My History
              </h2>
              
              <div className="space-y-4 mb-8">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="text" placeholder="Search by food name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredOrders.length === 0 && <p className="text-center text-zinc-400 py-10 font-bold italic">No match found.</p>}
                 {filteredOrders.map(o => (
                    <div key={o.id} onClick={() => { setActiveOrderId(o.id); setEditingRating(false); }} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeOrderId === o.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-500'}`}>
                       <div className="flex justify-between items-start mb-1"><span className="font-mono text-[9px] font-black uppercase tracking-tighter">{o.id}</span> <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${activeOrderId === o.id ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{o.status}</span></div>
                       <p className={`font-bold text-sm truncate ${activeOrderId === o.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{o.orderItems[0]?.productName || 'Order'} {o.orderItems.length > 1 && `+${o.orderItems.length-1}`}</p>
                       <p className={`text-[9px] mt-1 opacity-70`}>{new Date(o.orderDate).toLocaleString('id-ID')}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Content: Advanced Milestone Tracking & Delivered Rating form */}
        <div className="flex-1 space-y-8">
           {currentOrder ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                   <div className="flex justify-between items-center mb-10 border-b border-zinc-100 dark:border-zinc-800 pb-8">
                      <div>
                         <h1 className="text-4xl font-black mb-2">{currentOrder.status === 'cancelled' ? 'Dropped' : 'Progress'}</h1>
                         <p className="font-mono text-zinc-400 font-bold tracking-[0.2em]">{currentOrder.id}</p>
                      </div>
                      <Package className="w-12 h-12 text-indigo-100" />
                   </div>

                   {currentOrder.status === 'cancelled' ? (
                      <div className="p-10 bg-rose-50 rounded-3xl text-center border-2 border-dashed border-rose-200"><h3 className="text-2xl font-black text-rose-600">Pesanan Dibatalkan</h3><p className="text-zinc-400 italic">&quot;{currentOrder.cancelReason || 'Kebijakan Rumah Sakit'}&quot;</p></div>
                   ) : (
                      <div className="relative pl-10 space-y-10">
                         <div className="absolute left-[3.5px] top-4 bottom-4 w-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"><div className="bg-emerald-500 w-full transition-all duration-1000" style={{height: `${Math.max(0, (currentStatusNum - 1) * 20)}%`}}></div></div>
                         {steps.map((step) => {
                            const active = currentStatusNum >= step.n;
                            const isCurrent = currentStatusNum === step.n;
                            const Icon = step.icon;
                            return (
                               <div key={step.n} className={`relative flex items-center gap-8 ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                  <div className={`absolute -left-[46px] w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center transition-all duration-500 z-10 ${active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}><Icon className="w-4 h-4" /></div>
                                  <div>
                                     <h3 className={`font-black text-xl flex items-center gap-2 ${active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-300'}`}>{step.label} {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>}</h3>
                                     <p className="text-zinc-400 font-bold text-sm tracking-tighter">{step.desc}</p>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}

                   {/* Point 2 Fix: Rating form directly below milestone board */}
                   {(currentOrder.status === 'delivered' || currentOrder.submittedRating) && (
                      <div className="mt-16 p-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border-2 border-dotted border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-bottom duration-700">
                         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                               <h3 className="text-2xl font-black mb-1">Berikan Ulasan</h3>
                               <p className="text-zinc-400 text-sm font-bold">Terima kasih atas penilaian Anda</p>
                            </div>
                            
                            <div className="flex flex-col items-center md:items-end gap-3">
                                {currentOrder.submittedRating && !editingRating ? (
                                   <>
                                      <div className="flex flex-col items-center md:items-end gap-2">
                                         <div className="flex gap-1">
                                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-8 h-8 ${s <= currentOrder.submittedRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />)}
                                         </div>
                                         {currentOrder.reviewText && (
                                            <p className="text-xs bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 italic">&quot;{currentOrder.reviewText}&quot;</p>
                                         )}
                                      </div>
                                   </>
                                ) : (
                                   <div className="w-full flex flex-col gap-4">
                                      <div className="flex gap-2 justify-center md:justify-end">
                                         {[1,2,3,4,5].map(s => <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)} className="transition-transform active:scale-95 duration-200"><Star className={`w-12 h-12 ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} /></button>)}
                                      </div>
                                      <textarea 
                                         value={reviewText} 
                                         onChange={e => setReviewText(e.target.value)} 
                                         placeholder="Tuliskan ulasan Anda di sini..." 
                                         className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                         rows={3}
                                      />
                                      <button onClick={handleRate} disabled={isSubmittingRating} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest">
                                         {isSubmittingRating ? 'Saving...' : 'Submit Rating'}
                                      </button>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                   <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="text-xl font-black mb-6">Delivery Target</h3>
                      <div className="space-y-6">
                         <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0"><MapPin className="w-6 h-6" /></div>
                            <div>
                               <p className="font-black text-xs uppercase text-zinc-400">Location</p>
                               <p className="font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-tighter">{currentOrder.floor} {currentOrder.location && `– ${currentOrder.location}`}</p>
                            </div>
                         </div>
                         <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                           <ul className="space-y-2">
                             {currentOrder.orderItems.map((item: any, i: number) => (
                               <li key={i} className="flex justify-between text-sm font-medium">
                                 <span className="text-zinc-500">{item.productName}</span>
                                 <span className="font-bold">x{item.quantity}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                      </div>
                   </div>
                   <div className="bg-zinc-900 dark:bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2 text-center">Estimation Price Total</p>
                      <p className="text-4xl font-black text-center text-indigo-400 dark:text-indigo-600">Rp {currentOrder.totalAmount.toLocaleString()}</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-[600px] flex flex-col items-center justify-center text-center p-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                <ChevronRight className="w-20 h-20 text-indigo-100 mb-6" />
                <h3 className="text-2xl font-black mb-2 text-zinc-900 dark:text-zinc-100">Pilih Pesanan</h3>
                <p className="text-zinc-400 max-w-xs font-medium">Klik pada riwayat pesanan di samping untuk melihat rincian pengiriman dan status milestone secara real-time.</p>
                <button onClick={() => router.push('/order')} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20">Buat Pesanan Baru</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
