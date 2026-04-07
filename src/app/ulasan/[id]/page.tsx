"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getMenuReviews } from "@/app/actions";
import { Star, ArrowLeft, RefreshCw, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UlasanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [visibleReviews, setVisibleReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const REVIEWS_PER_PAGE = 8;
  const observerTarget = useRef(null);

  // For unwrapping params if needed in Next 15, but standard works too if we just use params.id
  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    getMenuReviews(id).then(data => {
      setAllReviews(data || []);
      setVisibleReviews((data || []).slice(0, REVIEWS_PER_PAGE));
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load reviews:", err);
      setLoading(false);
    });
  }, [id]);

  const loadMore = useCallback(() => {
    const nextLimit = (page + 1) * REVIEWS_PER_PAGE;
    if (visibleReviews.length < allReviews.length) {
      setVisibleReviews(allReviews.slice(0, nextLimit));
      setPage(p => p + 1);
    }
  }, [page, visibleReviews.length, allReviews]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-10 pb-40">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold mb-8 transition-colors group"
        >
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Kembali
        </button>

        <h1 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
          <MessageSquare className="text-indigo-500" /> Ulasan Produk
        </h1>
        <p className="text-zinc-500 mb-10 font-medium">Baca ulasan dari pelanggan lain mengenai menu ini.</p>

        {allReviews.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-2xl font-black text-zinc-400 mb-2">Belum Ada Ulasan</h3>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Jadilah yang pertama untuk menilai menu ini setelah pesanan Anda selesai!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleReviews.map((r, i) => (
              <div key={i} className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-zinc-800 overflow-hidden ring-4 ring-indigo-50 dark:ring-zinc-950 flex items-center justify-center text-indigo-500 font-black text-xl">
                      {r.userImage ? (
                        <img src={r.userImage} className="w-full h-full object-cover" alt={r.userName} />
                      ) : (
                        r.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-black">{r.userName}</p>
                      <p className="text-xs font-bold text-zinc-400 mt-0.5">{new Date(r.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-4 h-4 ${idx < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800"}`} />
                    ))}
                  </div>
                </div>
                <div className="mt-4 pl-[4.5rem]">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed font-serif italic relative">
                    <span className="text-indigo-200 dark:text-indigo-900 text-4xl absolute -left-6 -top-3 font-serif opacity-50">&quot;</span>
                    {r.reviewText || "Pelanggan memberikan rating tanpa deskripsi ulasan."}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Intersection target */}
            <div ref={observerTarget} className="py-8 w-full flex justify-center">
              {visibleReviews.length < allReviews.length ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memuat lebih banyak...
                </div>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Anda telah membaca semua ulasan</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
