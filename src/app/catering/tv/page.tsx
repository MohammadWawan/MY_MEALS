"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPendingOrders } from "@/app/actions";
import { Info, Volume2, User, Stethoscope, ChefHat, MapPin } from "lucide-react";

export default function TVMonitor() {
  const [orders, setOrders] = useState<any[]>([]);
  const [interacted, setInteracted] = useState(false);
  const prevCountRef = useRef(0);

  const playNotification = useCallback(() => {
     try {
       const msg = new SpeechSynthesisUtterance("Perhatian! Pesanan baru telah masuk. Harap segera disiapkan!");
       msg.lang = 'id-ID';
       msg.pitch = 1.1; // Slightly higher for more "female" resonance if voice match is generic
       msg.rate = 1.0;
       
       const voices = window.speechSynthesis.getVoices();
       // Prioritize Indonesian Female voices (Microsoft Gadis, Google Bahasa Indonesia, etc)
       const femaleIndo = voices.find(v => v.lang.startsWith('id') && (v.name.toLowerCase().includes('female') || v.name.includes('Gadis') || v.name.includes('Google'))) 
                       || voices.find(v => v.lang.startsWith('id'));
       
       if (femaleIndo) {
          msg.voice = femaleIndo;
       }
       window.speechSynthesis.speak(msg);
     } catch (e) {
       console.error("Speech error", e);
     }
  }, []);

  const fetchOrders = useCallback(async () => {
    const data = await getPendingOrders();
    const mapped = data.map(o => ({
      id: o.id,
      customerName: o.user?.name || 'Unknown',
      orderDate: o.orderDate,
      status: o.status,
      orderType: o.orderType,
      floor: o.floor,
      location: o.location,
      roomNumber: o.roomNumber,
      description: o.description,
      items: o.orderItems.map((oi: any) => `${oi.quantity}x ${oi.productName}`).join(", ")
    }));
    
    setOrders(mapped);
    
    // Voice notification for NEW orders
    const newCount = mapped.filter(o => o.status === 'created').length;
    if (newCount > prevCountRef.current && interacted) {
       playNotification();
    }
    prevCountRef.current = newCount;
  }, [interacted, playNotification]);

  useEffect(() => {
     // Prime voices on mount for better browser support
     if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        const handleVoices = () => window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = handleVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
     }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); 
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'created': return 'bg-amber-100 text-amber-800 animate-pulse';
      case 'preparing': return 'bg-indigo-100 text-indigo-800';
      case 'ready': return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'delivering': return 'bg-blue-100 text-blue-800';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  if (!interacted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center animate-bounce mb-10 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
           <Volume2 className="text-white w-16 h-16" />
        </div>
        <h1 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">Kitchen Monitor System</h1>
        <p className="text-zinc-500 mb-10 text-xl font-medium">Click anywhere to activate real-time notifications and Voice Assistant</p>
        <button onClick={() => setInteracted(true)} className="px-12 py-5 bg-white text-black text-2xl font-black rounded-3xl hover:scale-110 active:scale-95 transition-all shadow-2xl">ACTIVATE MONITOR</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-10 flex flex-col">
      <header className="flex justify-between items-center mb-10 pb-10 border-b border-zinc-800">
         <div>
            <h1 className="text-6xl font-black text-white flex items-center gap-6">
              <ChefHat className="w-20 h-20 text-indigo-500" /> MEAL TRACKER BOARD
            </h1>
            <p className="text-zinc-500 mt-2 text-xl font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ONLINE • REAL-TIME SYNC
            </p>
         </div>
         <div className="text-right">
            <h2 className="text-4xl font-mono font-black text-indigo-500">{new Date().toLocaleTimeString('id-ID')}</h2>
            <p className="text-zinc-500 mt-1 font-bold">RS HERMINA PASURUAN</p>
         </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-y-4">
           <thead>
             <tr className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">
               <th className="px-8 pb-4">Order ID</th>
               <th className="px-8 pb-4">Identitas Pemesan</th>
               <th className="px-8 pb-4">Type</th>
               <th className="px-8 pb-4">Lantai / Lokasi</th>
               <th className="px-8 pb-4">Pesanan</th>
               <th className="px-8 pb-4">Status</th>
             </tr>
           </thead>
           <tbody className="text-white">
             {orders.filter(o => ['created', 'preparing', 'ready', 'delivering'].includes(o.status)).map((order, idx) => (
               <tr key={order.id} className={`rounded-3xl transition-all animate-in fade-in slide-in-from-right duration-700 ${order.orderType === 'doctor' ? 'bg-rose-950/20 border-l-8 border-rose-500' : 'bg-emerald-950/20 border-l-8 border-emerald-500'}`}>
                 <td className="px-8 py-8">
                    <div className={`text-3xl font-mono font-black ${order.orderType === 'doctor' ? 'text-rose-400' : 'text-emerald-400'}`}>{order.id}</div>
                    <div className="text-xs text-zinc-600 mt-1">{new Date(order.orderDate).toLocaleTimeString()}</div>
                 </td>
                 <td className="px-8 py-8">
                    <div className="text-2xl font-black uppercase tracking-tight">{order.customerName}</div>
                 </td>
                 <td className="px-8 py-8">
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${order.orderType === 'doctor' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                       {order.orderType === 'doctor' ? 'DOCTOR' : 'PATIENT'}
                    </span>
                 </td>
                 <td className="px-8 py-8">
                    <div className="flex items-center gap-3">
                       <MapPin className="text-zinc-600 w-5 h-5" />
                       <div className="text-xl font-bold text-zinc-300">
                         {order.floor} 
                         <span className="text-zinc-600 text-sm ml-2">{order.location}</span>
                         {order.roomNumber && <span className="text-indigo-400 text-sm ml-4 font-black">KM. {order.roomNumber}</span>}
                       </div>
                    </div>
                 </td>
                 <td className="px-8 py-8 w-1/4">
                    <div className="text-zinc-400 text-lg italic line-clamp-2">{order.items}</div>
                 </td>
                 <td className="px-8 py-8">
                    <span className={`px-8 py-3 rounded-2xl text-xl font-black uppercase ${getStatusColor(order.status)}`}>
                       {order.status}
                    </span>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      <footer className="mt-10 pt-10 border-t border-zinc-900 grid grid-cols-3 gap-10">
         <div className="bg-emerald-950/30 p-6 rounded-3xl border border-emerald-900/50 flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500"><User className="w-8 h-8" /></div>
            <div>
               <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Patient Color Code</p>
               <h4 className="text-xl font-black text-white">PASTEL GREEN</h4>
            </div>
         </div>
         <div className="bg-rose-950/30 p-6 rounded-3xl border border-rose-900/50 flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500"><Stethoscope className="w-8 h-8" /></div>
            <div>
               <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Doctor Color Code</p>
               <h4 className="text-xl font-black text-white">PASTEL RED</h4>
            </div>
         </div>
         <div className="bg-indigo-950/30 p-6 rounded-3xl border border-indigo-900/50 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500"><Volume2 className="w-8 h-8" /></div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Voice Assistant</p>
               <h4 className="text-xl font-black text-white uppercase italic">Active Indo-Female</h4>
            </div>
         </div>
      </footer>
    </div>
  );
}
