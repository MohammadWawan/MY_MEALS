"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Utensils, Stethoscope, MapPin, ShieldAlert, Star, Search, Minus, Plus, ShoppingBag, ArrowRight, X, Info } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getMenus, createOrder, validateCoupon, getMenuReviews, getLocations } from "@/app/actions";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageProvider";

function OrderContent() {
  const { t, language } = useLanguage();
  const { user, cart, addToCart, removeFromCart, updateQty, clearCart } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);



  // Special Doctor Flow Controls (Admins can toggle for testing)
  const [adminOrderType, setAdminOrderType] = useState("customer");
  
  // States for Checkout
  const [mrn, setMrn] = useState("");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [location, setLocation] = useState("");
  const [isAdvance, setIsAdvance] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponData, setCouponData] = useState<any>(null);

  const [floorLocations, setFloorLocations] = useState<Record<string, string[]>>({});

  const fetchMenu = useCallback(async () => {
    try {
      const items = await getMenus();
      setMenuItems(items);
      
      const locData = await getLocations();
      const grouped: Record<string, string[]> = {};
      locData.forEach((l: any) => {
        if (!grouped[l.floor]) grouped[l.floor] = [];
        grouped[l.floor].push(l.name);
      });
      // Sort names within each floor
      Object.keys(grouped).forEach(f => {
        grouped[f].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      });
      setFloorLocations(grouped);
    } catch (e) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
    fetchMenu();
    const interval = setInterval(fetchMenu, 5000);

    const isCheckoutOpen = searchParams.get('checkout') === 'true';
    if (isCheckoutOpen) setShowCheckout(true);

    return () => clearInterval(interval);
  }, [fetchMenu, searchParams]);

  const displayLocations = floorLocations;

  // Staff should not be here
  const isStaff = user && ['cashier', 'catering', 'waiter', 'perawat'].includes(user.role as string);
  useEffect(() => {
    if (mounted && user && isStaff && user.role !== 'admin') {
      const target = (user.role as string) === 'waiter' ? '/server' : (user.role as string) === 'perawat' ? '/nurse' : `/${user.role}`;
      toast.error(`Staff role (${user.role}) is not authorized for ordering.`);
      router.push(target);
    }
  }, [mounted, user, isStaff, router]);

  const fetchReviews = async (menuId: string) => {
    setLoadingReviews(true);
    try {
      const data = await getMenuReviews(menuId);
      setReviews(data);
    } catch (e) {
      console.error("fetchReviews error", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      fetchReviews(selectedItem.id);
      setShowReviews(false);
    }
  }, [selectedItem]);

  if (!mounted || !user) return null;

  const isDoctor = user.role === 'doctor' || (user.role === 'admin' && adminOrderType === 'doctor');
  const currentOrderType = user.role === 'admin' ? adminOrderType : (user.role === 'doctor' ? 'doctor' : 'customer');

  const filteredMenuItems = menuItems.filter(item => {
    const matchesRole = (item.menuType || 'customer') === currentOrderType;
    const matchesCategory = currentCategory === "all" || item.category === currentCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesCategory && matchesSearch;
  });

  const categories = ["all", ...Array.from(new Set(menuItems.filter(i => (i.menuType || 'customer') === currentOrderType).map(item => item.category)))];

  const subtotal = cart.reduce((sum, item) => {
    const p = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    return sum + (p * item.qty);
  }, 0);
  
  const cartTotal = Math.max(0, subtotal - discountAmount);

  
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const applyCoupon = async () => {
    if (!couponCode) {
      setDiscountAmount(0);
      setAppliedCoupon("");
      setCouponData(null);
      toast.info("Kupon telah dibatalkan.");
      return;
    }
    const loadingToast = toast.loading("Validating coupon...");
    try {
      const result = await validateCoupon(couponCode);
      if (!result.success) {
        toast.error(result.error);
        setDiscountAmount(0);
        setAppliedCoupon("");
        setCouponData(null);
      } else {
        const coupon = result.coupon;
        if (!coupon) return;

        let amount = 0;
        if (coupon.discountType === 'percentage') {
          amount = subtotal * (coupon.discountValue / 100);
        } else {
          amount = coupon.discountValue;
        }
        setDiscountAmount(amount);
        setAppliedCoupon(coupon.code);
        setCouponData(coupon);
        toast.success(`Kupon ${coupon.code} berhasil dipasang!`);
      }
    } catch (e) {
      toast.error("Gagal validasi kupon");
    } finally {
      toast.dismiss(loadingToast);
    }
  };




  const displayPrice = (price: any) => {
    if (isDoctor) return 0;
    return typeof price === 'number' ? price : (parseFloat(price) || 0);
  };

  const getItemQty = (id: string) => {
    return cart.find(i => i.id === id)?.qty || 0;
  };
  const handleCheckout = async () => {
    if (!user) return router.push("/auth/login");
    if (cart.length === 0) return toast.error("Keranjang kosong!");
    if (!floor || !location) return toast.error("Lantai dan Lokasi wajib diisi!");

    if (isDoctor) {
       const orderData = {
          userId: user.id,
          totalAmount: 0,
          deliveryType: isAdvance ? 'advance' : 'immediate',
          status: "received", 
          isPaid: true,
          paymentMethod: 'doctor_quota',
          receiptImageUrl: "",
          mrn: "",
          description: description,
          orderType: 'doctor',
          floor: floor,
          location: location,
          roomNumber: roomNumber,
          items: cart.map(c => ({
             productId: c.id,
             productName: c.name,
             price: 0,
             quantity: c.qty
          }))
       };

       try {
          const result = await createOrder(orderData);
          if (!result.success) {
             toast.error(result.error || "Gagal memproses pesanan dokter.");
             return;
          }
          toast.success("Pesanan berhasil diproses!");
          clearCart();
          router.push("/tracking");
       } catch (err: any) {
          toast.error(err.message || "Gagal memproses pesanan");
       }
    } else {
       const params = new URLSearchParams();
       params.set('advance', isAdvance.toString());
       params.set('mrn', mrn);
       params.set('desc', description);
       params.set('floor', floor);
       params.set('location', location);
       params.set('roomNumber', roomNumber);
       params.set('orderType', 'customer');
       if (discountAmount > 0) {
          params.set('discountAmount', discountAmount.toString());
          params.set('coupon', appliedCoupon);
       }
       router.push(`/payment?${params.toString()}`);

    }
  };

  const addToCartWithFix = (item: any) => {
    const priceNum = displayPrice(item.price);
    addToCart({
      id: item.id,
      name: item.name,
      price: priceNum,
      qty: 1,
      image: item.imageUrl || item.image
    });
    toast.success(`${item.name} ditambahkan ke keranjang`);
  };

  const updateQtyWithFix = (item: any, delta: number) => {
    const priceNum = displayPrice(item.price);
    updateQty(item.id, delta, {
      id: item.id,
      name: item.name,
      price: priceNum,
      qty: 1,
      image: item.imageUrl || item.image
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      {/* Header Section */}
      <header className="px-6 py-10 max-w-7xl mx-auto w-full">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
            <div className="flex-1">
               <h1 className="text-7xl font-black mb-6 tracking-tighter text-indigo-900 dark:text-indigo-100 leading-none">
                  {t('order.title')}
               </h1>
               <p className="text-zinc-600 dark:text-zinc-400 text-2xl font-medium max-w-2xl leading-relaxed">
                  {t('order.subtitle')}
               </p>
            </div>
            
            {user.role === 'admin' && (
              <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-3xl gap-2 shadow-2xl shrink-0">
                 <button onClick={() => setAdminOrderType("customer")} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminOrderType === 'customer' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-xl' : 'text-zinc-500'}`}>{language === 'id' ? 'Order Umum' : 'Customer Order'}</button>
                 <button onClick={() => setAdminOrderType("doctor")} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminOrderType === 'doctor' ? 'bg-white dark:bg-zinc-800 text-rose-600 shadow-xl' : 'text-zinc-500'}`}>{language === 'id' ? 'Order Dokter' : 'Doctor Order'}</button>
              </div>
            )}
         </div>

         {/* Categories & Search */}
         <div className="flex flex-col lg:flex-row gap-8 items-center bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar flex-1 w-full scale-90 origin-left">
               {categories.map((catId) => {
                  const label = catId === 'all' ? t('order.all') : (catId.charAt(0).toUpperCase() + catId.slice(1));
                  const Icon = catId === 'all' ? Utensils : ShoppingBag;
                  return (
                    <button 
                      key={catId} 
                      onClick={() => setCurrentCategory(catId)}
                      className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-3 ${currentCategory === catId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100'}`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  );
               })}
            </div>
            <div className="relative w-full lg:w-[450px]">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
               <input 
                 type="text" 
                 placeholder={t('common.search')}
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] py-5 pl-16 pr-8 text-xl font-bold text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-indigo-500/20 shadow-inner transition-all"
               />
            </div>
         </div>
      </header>

      {/* Grid Menu */}
      <main className="px-6 pb-40 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMenuItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800/50 overflow-hidden group hover:border-zinc-700 transition-all duration-500 flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
               <img src={item.imageUrl || item.image || "/placeholder.png"} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               
               <div className="absolute top-4 left-4 bg-zinc-100 dark:bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-black">{item.rating?.toFixed(1) || "0.0"}</span>
               </div>
               <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 pb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{item.category}</span>
               </div>
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                     <Info className="text-white w-6 h-6" />
                  </div>
               </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
               <h3 className="text-2xl font-black mb-2 group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>{item.name}</h3>
               <p className="text-zinc-500 text-sm font-medium mb-6 line-clamp-2">{item.description}</p>
               
               <div className="mt-auto">
                  <div className="flex justify-between items-center mb-6">
                     <p className={`font-black text-indigo-500 transition-all duration-300 ${isDoctor ? "text-3xl" : displayPrice(item.price).toLocaleString('id-ID').length > 8 ? "text-xl" : "text-3xl"}`}>
                       {isDoctor ? "FREE" : `Rp ${displayPrice(item.price).toLocaleString('id-ID')}`}
                     </p>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-2xl p-2 h-16 shadow-inner relative group/qty">
                     <button onClick={() => updateQtyWithFix(item, -1)} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                       <Minus className="w-5 h-5" />
                     </button>
                     <span className="text-xl font-black text-white w-12 text-center">{getItemQty(item.id)}</span>
                     <button onClick={() => updateQtyWithFix(item, 1)} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                       <Plus className="w-5 h-5" />
                     </button>
                     
                     {getItemQty(item.id) > 0 && (
                        <button onClick={() => removeFromCart(item.id)} className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover/qty:opacity-100 transition-opacity animate-in zoom-in shadow-lg">
                           <X className="w-3 h-3" />
                        </button>
                     )}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80">
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[90vh]">
              <div className="w-full md:w-1/2 relative bg-zinc-950 flex items-center justify-center">
                 <img src={selectedItem.imageUrl || selectedItem.image || "/placeholder.png"} alt={selectedItem.name} className="w-full h-full object-cover md:object-center" />
                 <button onClick={() => setSelectedItem(null)} className="absolute top-6 left-6 p-4 bg-black/50 backdrop-blur-md text-white rounded-full md:hidden">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col overflow-y-auto">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg mb-4 inline-block">{selectedItem.category}</span>
                       <h2 className="text-4xl font-black leading-tight text-white mb-2">{selectedItem.name}</h2>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-amber-400">
                             <Star className="w-4 h-4 fill-current" />
                             <span className="text-sm font-black">{selectedItem.rating?.toFixed(1) || "0.0"} ({selectedItem.reviews || 0} {language === 'id' ? 'Ulasan' : 'Reviews'})</span>
                          </div>
                          <button 
                            onClick={() => router.push(`/ulasan/${selectedItem.id}`)}
                            className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                          >
                            {language === 'id' ? 'Lihat Ulasan' : 'View Reviews'}
                            <ArrowRight className={`w-3 h-3`} />
                          </button>
                       </div>
                    </div>

                    <button onClick={() => setSelectedItem(null)} className="hidden md:block p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X className="w-8 h-8" /></button>
                 </div>

                 <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mb-6">{selectedItem.description}</p>

                  {selectedItem.nutrition && (() => {
                     let parsed = [];
                     try { parsed = JSON.parse(selectedItem.nutrition); } catch(e){}
                     if (parsed.length === 0) return null;
                     return (
                        <div className="mb-10 flex-shrink-0 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                           <div className="bg-zinc-100 dark:bg-zinc-800/50 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
                              <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">{language === 'id' ? 'Nutrisi' : 'Nutrition'}</h4>
                              <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">{language === 'id' ? 'Jumlah' : 'Amount'}</h4>
                           </div>
                           <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                              <table className="w-full">
                                 <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800">
                                    {parsed.map((n: any, idx: number) => (
                                       <tr key={idx} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                                          <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400 text-[11px] font-bold uppercase truncate">{n.indicator}</td>
                                          <td className="px-6 py-3 text-zinc-900 dark:text-white text-xs font-black text-right">{n.value}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     );
                  })()}


                 <div className="mt-auto space-y-8">
                    <div className="flex justify-between items-end">
                       <p className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-1">{t('order.total')}</p>
                       <p className={`font-black text-indigo-500 transition-all duration-300 ${isDoctor ? "text-4xl" : displayPrice(selectedItem.price).toLocaleString('id-ID').length > 8 ? "text-3xl" : "text-5xl"}`}>
                         {isDoctor ? "FREE" : `Rp ${displayPrice(selectedItem.price).toLocaleString('id-ID')}`}
                       </p>
                    </div>

                    <div className="flex gap-4">
                       <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-3xl p-2 h-20 shadow-inner flex-1">
                          <button onClick={() => updateQtyWithFix(selectedItem, -1)} className="w-16 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-2xl transition-all">
                                  <Minus className="w-6 h-6" />
                          </button>
                          <span className="text-2xl font-black text-white w-12 text-center">{getItemQty(selectedItem.id)}</span>
                          <button onClick={() => updateQtyWithFix(selectedItem, 1)} className="w-16 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-2xl transition-all">
                                  <Plus className="w-5 h-5" />
                          </button>
                       </div>
                       <button 
                         onClick={() => {
                            if (getItemQty(selectedItem.id) === 0) updateQtyWithFix(selectedItem, 1);
                            setSelectedItem(null);
                         }} 
                         className="flex-[1.5] bg-white text-zinc-950 rounded-3xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                       >
                          {t('order.add_to_cart')}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Floating Cart & Checkout Button */}
      {totalItems > 0 && !showCheckout && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xl animate-in slide-in-from-bottom-10 duration-500 z-50">
          <button onClick={() => setShowCheckout(true)} className="w-full bg-white text-zinc-950 p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group">
            <div className="flex items-center gap-4 pl-2">
               <div className="bg-zinc-950 text-white w-12 h-12 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('checkout.summary')}</p>
                  <p className="text-xl font-black">{totalItems} Item • Rp {cartTotal.toLocaleString('id-ID')}</p>
               </div>
            </div>
            <div className="bg-zinc-100 p-4 rounded-2xl px-8 flex items-center gap-3 font-black uppercase text-xs transition-colors hover:bg-zinc-200">
               {language === 'id' ? 'Lanjut' : 'Proceed'} <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5 duration-300">
              <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
                 <h2 className="text-3xl font-black flex items-center gap-3">
                    <MapPin className="text-rose-500" /> {t('checkout.delivery_info')}
                 </h2>
                 <button onClick={() => setShowCheckout(false)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!isDoctor && (
                       <div className="md:col-span-2">
                          <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">{t('checkout.mrn_placeholder')}</label>
                          <input type="text" placeholder="ID Pasien..." value={mrn} onChange={e => setMrn(e.target.value)} className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-700" />
                       </div>
                    )}
                    <div>
                       <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">{t('checkout.floor')}</label>
                       <select value={floor} onChange={e => { setFloor(e.target.value); setLocation(""); }} className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold appearance-none cursor-pointer">
                          <option value="">{t('checkout.floor')}</option>
                          {Object.keys(displayLocations).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(f => (
                             <option key={f} value={f}>{f}</option>
                          ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">{t('checkout.location')}</label>
                       <select value={location} onChange={e => setLocation(e.target.value)} disabled={!floor} className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="">{t('checkout.location')}</option>
                          {floor && displayLocations[floor]?.map(loc => (
                             <option key={loc} value={loc}>{loc}</option>
                          ))}
                       </select>
                    </div>
                    <div className="md:col-span-2">
                         <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">{t('checkout.room_placeholder')}</label>
                         <input type="text" placeholder={t('checkout.room_placeholder')} value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-700" />
                     </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">{t('checkout.note')}</label>
                       <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('checkout.note')} rows={3} className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none resize-none text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-700"></textarea>
                    </div>
                 </div>

                 {!isDoctor && (
                   <div className="space-y-3">
                      <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">{t('checkout.coupon')}</label>
                      <div className="flex gap-3">
                         <input 
                           type="text" 
                           placeholder="Masukkan kode kupon..." 
                           value={couponCode} 
                           onChange={e => setCouponCode(e.target.value)} 
                           className="flex-1 px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-700" 
                         />
                         <button 
                           onClick={applyCoupon}
                           className="px-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-colors"
                         >
                            {t('checkout.apply')}
                         </button>
                      </div>
                      {appliedCoupon && (
                         <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Kupon {appliedCoupon} Aktif ({couponData?.discountType === 'percentage' ? `${couponData.discountValue}%` : `Rp ${couponData?.discountValue.toLocaleString()}`})
                         </p>
                      )}

                   </div>
                 )}

                 {isDoctor && (
                   <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                      <div>
                         <p className="font-black text-sm">{t('checkout.advance')}</p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{language === 'id' ? 'Pesan untuk jadwal besok' : 'Pre-order for tomorrow menu'}</p>
                      </div>
                      <button onClick={() => setIsAdvance(!isAdvance)} className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${isAdvance ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${isAdvance ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                 )}
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800">
                 <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs font-black text-zinc-500 uppercase tracking-widest">
                       <span>Subtotal</span>
                       <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {discountAmount > 0 && (
                       <div className="flex justify-between items-center text-xs font-black text-emerald-500 uppercase tracking-widest">
                          <span>Potongan Kupon</span>
                          <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                       </div>
                    )}

                    <div className="flex justify-between items-end pt-2">
                       <span className="text-zinc-500 font-black uppercase text-xs tracking-widest">{language === 'id' ? 'Total Bayar' : 'Grand Total'}</span>
                       <span className="text-4xl font-black text-indigo-500">Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                 </div>
                 <button onClick={handleCheckout} className="w-full py-6 bg-white text-zinc-950 text-xl font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                    {isDoctor ? (language === 'id' ? 'KONFIRMASI PESANAN DOKTER' : 'CONFIRM DOCTOR ORDER') : t('checkout.place_order')}
                    <ArrowRight className="w-6 h-6" />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
export default function OrderPage() {
   return (
      <Suspense fallback={<div>Loading...</div>}>
         <OrderContent />
      </Suspense>
   );
}
