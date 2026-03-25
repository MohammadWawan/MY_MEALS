"use client";

import { useState, useEffect } from "react";
import { Plus, Ticket, Save, Trash2, Edit2, XCircle, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
import { addCoupon, getCoupons, updateCoupon, deleteCoupon } from "@/app/actions";
import { toast } from "sonner";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    discountValue: "",
    discountType: "percentage", // percentage, fixed
    expiryDate: ""
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const data = await getCoupons();
    setCoupons(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating coupon..." : "Adding coupon...");

    try {
      let result;
      if (editingId) {
        result = await updateCoupon(editingId, {
          code: form.code.toUpperCase(),
          discountValue: parseFloat(form.discountValue),
          discountType: form.discountType,
          expiryDate: form.expiryDate ? new Date(form.expiryDate) : null
        });
        if (result.success) toast.success("Coupon updated successfully.");
      } else {
        result = await addCoupon({
          code: form.code.toUpperCase(),
          discountValue: parseFloat(form.discountValue),
          discountType: form.discountType,
          expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined
        });
        if (result.success) toast.success("New coupon added.");
      }

      if (result && !result.success) {
        toast.error(result.error);
      } else {
        setEditingId(null);
        setForm({ code: "", discountValue: "", discountType: "percentage", expiryDate: "" });
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem saat menyimpan kupon.");
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: any) => {
    try {
      const result = await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      if (result.success) {
        toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
        fetchCoupons();
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        const result = await deleteCoupon(id);
        if (result.success) {
          toast.success("Coupon deleted.");
          fetchCoupons();
        } else {
          toast.error(result.error);
        }
      } catch (err: any) {
        toast.error("Failed to delete coupon.");
      }
    }
  };


  const handleEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountValue: coupon.discountValue.toString(),
      discountType: coupon.discountType,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-zinc-50 tracking-tighter">Manage Coupons</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Set and manage discount codes for customers.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-[2] bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            {editingId ? <><Edit2 className="w-5 h-5" /> Edit Coupon</> : <><Plus className="w-5 h-5" /> Add New Coupon</>}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Coupon Code</label>
                <input required type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase" placeholder="RAMADAN20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Expiry Date (Optional)</label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                   <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Discount Value</label>
                <input required type="number" step="0.01" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={form.discountType === 'percentage' ? "e.g. 10 (for 10%)" : "e.g. 5000"} />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (IDR)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                <Save className="w-5 h-5" /> {isSubmitting ? "Processing..." : (editingId ? "Update Coupon" : "Save Coupon")}
              </button>
              {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setForm({ code: "", discountValue: "", discountType: "percentage", expiryDate: "" });}} className="px-6 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold py-3 rounded-xl transition-all active:scale-95">
                   <XCircle className="w-5 h-5" /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-500" /> Active Coupons
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {coupons.map(coupon => (
              <div key={coupon.id} className={`bg-white dark:bg-zinc-900 p-5 rounded-3xl border ${coupon.isActive ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 grayscale opacity-60'} flex flex-col shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-xl text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">{coupon.code}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `Rp ${coupon.discountValue.toLocaleString()} OFF`}
                      {coupon.expiryDate && ` • EXP: ${new Date(coupon.expiryDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button onClick={() => handleToggleActive(coupon)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                    {coupon.isActive ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-400" />}
                  </button>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800">
                  <button onClick={() => handleEdit(coupon)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="py-20 text-center text-zinc-400 text-sm italic bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                No coupons configured yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
