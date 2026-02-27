"use client";

import { useState, useEffect, useCallback } from "react";
import { ChefHat, MonitorPlay, Search, Calendar, Filter, User, Stethoscope, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { getPendingOrders, updateOrderStatus } from "@/app/actions";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function CateringDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders();
      setOrders(data.map(dbOrder => ({
        id: dbOrder.id,
        status: dbOrder.status,
        orderDate: dbOrder.orderDate,
        mrn: dbOrder.mrn,
        floor: dbOrder.floor,
        location: dbOrder.location,
        roomNumber: dbOrder.roomNumber,
        description: dbOrder.description,
        expectedDate: dbOrder.expectedDate,
        orderType: dbOrder.orderType,
        customerName: dbOrder.user?.name || 'Unknown',
        employeeId: dbOrder.user?.employeeId || null,
        itemDetails: dbOrder.orderItems.map((oi: any) => ({ name: oi.productName, qty: oi.quantity, price: oi.price })),
        isPaid: dbOrder.isPaid
      })));
    } catch(e) {
      console.error("Failed to fetch orders", e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); 
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Strict Role Protection
  useEffect(() => {
    if (mounted && user && user.role !== 'catering' && user.role !== 'admin') {
       toast.error("Unauthorized! Redirecting...");
       router.push("/");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) return null;

  const updateStatus = async (id: string, newStatus: string) => {
    await updateOrderStatus(id, newStatus);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    toast.success(`Order ${id} updated to ${newStatus}`);
  };

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // BACK-DATE: Show all history if no date filter, sorted by Date DESC
  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchQuery === "" || 
       o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (o.mrn && o.mrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Point 1: Hide if complete and older than today, unless dateFilter is active
    const orderDateStr = new Date(o.orderDate).toISOString().split('T')[0];
    const isToday = orderDateStr === new Date().toISOString().split('T')[0];
    const isFinalStatus = ['delivered', 'cancelled'].includes(o.status);

    const matchesDate = dateFilter 
      ? orderDateStr === dateFilter 
      : (isToday || !isFinalStatus);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const OrdererBadge = ({ order }: { order: any }) => (
    <div className={`mb-3 p-3 rounded-xl border ${order.orderType === 'doctor' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10'}`}>
      <div className="flex items-center gap-2 mb-1">
        {order.orderType === 'doctor' ? <Stethoscope className="w-3.5 h-3.5 text-rose-600" /> : <User className="w-3.5 h-3.5 text-emerald-600" />}
        <span className={`text-[10px] font-black uppercase tracking-wider ${order.orderType === 'doctor' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {order.orderType === 'doctor' ? 'Dokter / DPJP' : 'Customer / Pasien'}
        </span>
      </div>
      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{order.customerName}</p>
      <p className="text-xs text-indigo-600 font-bold mt-0.5 uppercase tracking-tighter">
        {order.floor || 'No Floor'} {order.location ? ` – ${order.location}` : ''} {order.roomNumber ? `(R.${order.roomNumber})` : ''}
      </p>
      {order.description && (
        <p className="text-[12px] mt-2 p-2 bg-white/50 rounded-lg text-white font-bold border border-rose-100">
          Note: {order.description}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <h1 className="text-4xl font-black flex items-center gap-3">
             <ChefHat className="text-indigo-600 w-10 h-10" /> Kitchen Hub
           </h1>
           <div className="flex gap-4">
              <button onClick={() => window.open('/catering/tv', '_blank')} className="px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-black font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"><MonitorPlay className="w-5 h-5 inline mr-2" /> Open Monitor</button>
           </div>
        </div>

        <style jsx global>{`
          @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 80cm; height: 80cm; background: white; color: black; padding: 2cm; }
            .print-container h1 { font-size: 60pt; }
            .print-container p { font-size: 40pt; }
            .print-container .items { font-size: 30pt; }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
             <input type="text" placeholder="Order ID / Name / MRN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500" />
           </div>
           <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
             <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500" />
           </div>
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
             <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value="all">Semua Status</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="created">New Order</option>
                <option value="preparing">Cooking</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
             </select>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
         {/* Layout divided into Active Boards (only if no historical date filter) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Board 1: New Ticket */}
            <div className={`bg-zinc-100 dark:bg-zinc-900/50 rounded-[2.5rem] p-8 h-max ${dateFilter ? 'opacity-50 grayscale pt-4 pb-2' : ''}`}>
               <h3 className="text-xl font-black mb-8 text-zinc-400 flex justify-between">New Tickets <span>{filteredOrders.filter(o => o.status === 'created').length}</span></h3>
               <div className="space-y-6">
                 {filteredOrders.filter(o => o.status === 'created').map(order => (
                   <div key={order.id} className="bg-white dark:bg-zinc-950 p-6 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex justify-between font-mono text-[10px] mb-4 font-black text-indigo-600"><span>{order.id}</span> <span>{new Date(order.orderDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                      <OrdererBadge order={order} />
                      <div className="space-y-1 mb-6 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                         {order.itemDetails.map((it: any, i: number) => <div key={i} className="flex justify-between text-xs"><span>{it.name}</span> <span className="font-bold">x{it.qty}</span></div>)}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={order.orderType === 'doctor' && new Date(order.expectedDate).toDateString() !== new Date().toDateString() && new Date(order.expectedDate) > new Date()}
                          onClick={() => updateStatus(order.id, 'preparing')} 
                          className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:bg-zinc-300 disabled:shadow-none"
                        >
                          {order.orderType === 'doctor' && new Date(order.expectedDate).toDateString() !== new Date().toDateString() && new Date(order.expectedDate) > new Date() ? 'Locked (Besok)' : 'Mulai Masak'}
                        </button>
                        <button onClick={() => handlePrint(order)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                           <Search className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Board 2: Cooking */}
            <div className={`bg-amber-50/50 dark:bg-amber-900/10 rounded-[2.5rem] p-8 h-max ${dateFilter ? 'opacity-50 grayscale pt-4 pb-2' : ''}`}>
               <h3 className="text-xl font-black mb-8 text-amber-600/60 flex justify-between">Cooking <span>{filteredOrders.filter(o => o.status === 'preparing').length}</span></h3>
               <div className="space-y-6">
                 {filteredOrders.filter(o => o.status === 'preparing').map(order => (
                    <div key={order.id} className="bg-white dark:bg-zinc-950 p-6 rounded-3xl shadow-lg border border-amber-100 dark:border-amber-900/20">
                      <div className="flex justify-between font-mono text-[10px] mb-4 font-black text-amber-600"><span>{order.id}</span> <span>{new Date(order.orderDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                      <OrdererBadge order={order} />
                      <div className="space-y-1 mb-6 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                         {order.itemDetails.map((it: any, i: number) => <div key={i} className="flex justify-between text-xs"><span>{it.name}</span> <span className="font-bold">x{it.qty}</span></div>)}
                      </div>
                      <button onClick={() => updateStatus(order.id, 'ready')} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/20">Pesanan Siap</button>
                    </div>
                 ))}
               </div>
            </div>

            {/* Board 3: History/Completed */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2.5rem] p-8 h-max min-h-[500px]">
               <h3 className="text-xl font-black mb-8 text-emerald-600/60 flex justify-between">{dateFilter ? 'Historical Records' : 'Completed/History'} <span>{filteredOrders.filter(o => ['ready', 'delivering', 'delivered', 'cancelled', 'pending-approval'].includes(o.status)).length}</span></h3>
               <div className="space-y-6">
                 {filteredOrders.filter(o => ['ready', 'delivering', 'delivered', 'cancelled', 'pending-approval'].includes(o.status)).map(order => (
                    <div key={order.id} className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/10 opacity-90">
                      <div className="flex justify-between font-mono text-[10px] mb-4 font-bold text-zinc-400"><span>{order.id}</span> <span>{order.status.toUpperCase()}</span></div>
                      <OrdererBadge order={order} />
                      <div className="flex justify-between items-center text-xs font-black uppercase text-indigo-400">
                         <span>{order.itemDetails.length} Items Selected</span>
                         {order.status === 'ready' && <button onClick={() => updateStatus(order.id, 'delivering')} className="px-3 py-1 bg-indigo-600 text-white rounded-lg">Kirim</button>}
                      </div>
                    </div>
                 ))}
               </div>
            </div>
         </div>
      </div>

      {printOrder && (
        <div className="print-container hidden print:block">
           <div className="text-center mb-10 border-b-[10px] border-black pb-10">
              <h1 className="font-black">RS HERMINA PASURUAN</h1>
              <p className="font-black uppercase tracking-widest">Instalasi Gizi / Tata Boga</p>
           </div>
           <h1 className="font-black mb-10">ORDER: {printOrder.id}</h1>
           <div className="space-y-10">
              <p><strong>PEMESAN:</strong> {printOrder.customerName}</p>
              <p><strong>LOKASI:</strong> {printOrder.floor} - {printOrder.location} {printOrder.roomNumber ? `(R.${printOrder.roomNumber})` : ''}</p>
              {printOrder.orderType !== 'doctor' && <p><strong>MRN:</strong> {printOrder.mrn || '-'}</p>}
              <p><strong>TIPE:</strong> {printOrder.orderType?.toUpperCase()}</p>
              <div className="items border-t-4 border-black pt-10 mt-10">
                 <h2 className="font-black mb-5">ITEM PESANAN:</h2>
                 {printOrder.itemDetails.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between border-b-2 border-zinc-200 py-4">
                       <span>{it.name}</span>
                       <span className="font-black font-mono">x{it.qty}</span>
                    </div>
                 ))}
              </div>
              {printOrder.description && (
                 <div className="mt-10 p-10 bg-zinc-100 rounded-[3rem]">
                    <p className="font-black">CATATAN:</p>
                    <p>{printOrder.description}</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
