"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions";
import { toast } from "sonner";

export default function PaymentPage() {
  const { cart, clearCart, user } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // Determine if it's advance order from URL query param
        const searchParams = new URLSearchParams(window.location.search);
        const isAdvance = searchParams.get("advance") === "true";
        const mrn = searchParams.get("mrn") || undefined;
        const description = searchParams.get("desc") || undefined;
        const floor = searchParams.get("floor") || undefined;
        const location = searchParams.get("location") || undefined;
        const roomNumber = searchParams.get("roomNumber") || undefined;
        const orderType = searchParams.get("orderType") || "customer";

        const orderData = {
           userId: user?.id || 0,
           totalAmount: cartTotal,
           deliveryType: isAdvance ? 'advance' : 'immediate',
           status: "received", // pending catering/cashier action
           isPaid: false, // not verified yet
           paymentMethod: method,
           receiptImageUrl: base64String,
           mrn: mrn,
           description: description,
           orderType: orderType,
           floor: floor,
           location: location,
           roomNumber: roomNumber,
           items: cart.map(c => ({
              productId: c.id,
              productName: c.name,
              price: c.price,
              quantity: c.qty
           }))
        };

        await createOrder(orderData);
        
        alert("Receipt uploaded successfully! \nYour order has been sent to the Cashier for validation.");
        setShowPopup(false);
        clearCart();
        router.replace("/tracking");
      };
      reader.readAsDataURL(file);
    }
  };

  if (cart.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center p-6 bg-slate-50 dark:bg-zinc-950">
           <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Your cart is empty</h2>
           <button onClick={() => router.push('/order')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer">
              Go to Menu
           </button>
        </div>
     );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 dark:bg-zinc-950 dark:text-slate-50">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden">
        <h1 className="text-3xl font-black mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Complete Your Payment</h1>
        
        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 mb-8">
           <h3 className="font-bold text-lg mb-4 text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 pb-2">Order Summary</h3>
           {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm mb-2 font-medium">
                 <span className="text-zinc-600 dark:text-zinc-400">{item.qty}x {item.name}</span>
                 <span className="text-zinc-900 dark:text-zinc-200">Rp {(item.price * item.qty).toLocaleString()}</span>
              </div>
           ))}
           <div className="flex justify-between font-black text-xl mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
               <span>Total Pay</span>
               <span className="text-indigo-600 dark:text-indigo-400">Rp {cartTotal.toLocaleString()}</span>
           </div>
        </div>

        <h3 className="font-bold text-center mb-4 text-zinc-600 dark:text-zinc-400">Select Payment Method</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button 
            onClick={() => {setMethod('qris'); setShowPopup(true);}} 
            className="flex flex-col items-center justify-center py-6 border-2 border-slate-200 hover:border-blue-500 rounded-2xl transition-all cursor-pointer dark:border-zinc-700 dark:hover:border-blue-400 group bg-slate-50 dark:bg-zinc-800"
          >
            <span className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">QRIS</span>
            <span className="text-xs text-slate-500">Scan & Pay</span>
          </button>
          <button 
            onClick={() => {setMethod('transfer'); setShowPopup(true);}} 
            className="flex flex-col items-center justify-center py-6 border-2 border-slate-200 hover:border-indigo-500 rounded-2xl transition-all cursor-pointer dark:border-zinc-700 dark:hover:border-indigo-400 group bg-slate-50 dark:bg-zinc-800"
          >
            <span className="text-xl font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Transfer</span>
            <span className="text-xs text-slate-500">Bank Transfer</span>
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300 border border-zinc-200 dark:border-zinc-700">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-2 text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center">
              {method === 'qris' ? 'Scan QRIS to Pay' : 'Bank Transfer Details'}
            </h2>
            
            <div className="flex justify-center mb-6">
              {method === 'qris' ? (
                <div className="w-48 h-48 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border-4 border-white shadow-xl">
                    <span className="font-mono text-sm">[ QR CODE IMAGE ]</span>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-full border-2 border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center justify-center gap-2 mb-3">
                     <div className="w-10 h-6 bg-blue-700 rounded flex items-center justify-center text-[8px] font-black text-white">BCA</div>
                     <span className="text-xs font-bold text-slate-500 uppercase">Bank Central Asia</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-black">Nomor Rekening</p>
                  <div className="flex items-center justify-center gap-3">
                     <p className="text-3xl font-mono font-black tracking-wider text-indigo-600 dark:text-indigo-400">8891 0293 481</p>
                     <button 
                       onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText("88910293481");
                          toast.success("Nomor rekening disalin!");
                       }}
                       className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-110 active:scale-95 transition-all"
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 002-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                     </button>
                  </div>
                  <p className="text-[10px] font-black mt-2 text-zinc-400">A/N HOSPITAL POS PROVIDER</p>
                </div>
              )}
            </div>

            <form onSubmit={handleUpload} className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Upload Transaction Receipt</label>
              <input 
                type="file" 
                required 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 cursor-pointer"
              />
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4 active:scale-95 transition-all outline-none">
                Submit Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
