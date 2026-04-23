"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.order': 'Order Menu',
    'nav.my_orders': 'My Orders',
    'nav.payments': 'Payments',
    'nav.kitchen': 'Kitchen Hub',
    'nav.server': 'Server Dash',
    'nav.validations': 'Validations',
    'nav.reports': 'Reports',
    'nav.manage_menus': 'Manage Menus',
    'nav.manage_coupons': 'Manage Coupons',
    'nav.add_doctor': 'Add Doctor',
    'nav.manage_staff': 'Manage Staff',
    'nav.manage_locations': 'Manage Locations',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Log in',
    'nav.signup': 'Sign up',
    
    // Common
    'common.search': 'Search...',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.today': 'TODAY',
    'common.back': 'Back',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.greeting': 'Hi',
    
    // Roles
    'role.admin': 'ADMIN',
    'role.customer': 'CUSTOMER',
    'role.doctor': 'DOCTOR',
    'role.waiter': 'SERVER',
    'role.cashier': 'CASHIER',
    'role.catering': 'KITCHEN',
    'role.perawat': 'NURSE',

    // Kitchen Hub
    'kitchen.title': 'Kitchen Hub',
    'kitchen.open_monitor': 'Open Monitor',
    'kitchen.new_tickets': 'New Tickets',
    'kitchen.cooking': 'Cooking',
    'kitchen.history': 'History',
    'kitchen.start_cooking': 'Start Cooking',
    'kitchen.ready': 'Ready to Serve',
    'kitchen.locked_tomorrow': 'Locked (Tomorrow)',

    // Home Page
    'home.hero_title': 'Seamless Hospital',
    'home.hero_highlight': 'Catering & Orders',
    'home.hero_desc': 'Advanced point-of-sale system built specifically for healthcare facilities. Manage operating room advance orders, real-time kitchen tracking, and QRIS payments in one unified platform.',
    'home.order_now': 'Order Now',
    'home.login': 'Login to Dashboard',
    'home.signup': 'Create an Account',
    'home.feature1_title': 'Advance Ordering',
    'home.feature1_desc': 'Schedule meals up to H-1 for operating rooms and specialized priority units.',
    'home.feature2_title': 'Real-time Kitchen',
    'home.feature2_desc': 'TV Dashboard monitoring from received orders to dispatch state dynamically.',
    'home.feature3_title': 'Easy Ordering',
    'home.feature3_desc': 'Simple and intuitive interface for quick food ordering anytime.',

    // Order Page
    'order.title': 'Delicious Healthy Meals',
    'order.subtitle': 'Freshly prepared for patients, staff, and visitors.',
    'order.categories': 'Categories',
    'order.all': 'All',
    'order.food': 'Food',
    'order.drinks': 'Drinks',
    'order.snacks': 'Snacks',
    'order.cart': 'Your Cart',
    'order.empty_cart': 'Your cart is empty',
    'order.checkout': 'Proceed to Checkout',
    'order.add_to_cart': 'Add to Cart',
    'order.added': 'Added',
    'order.qty': 'Qty',
    'order.total': 'Total',

    // Checkout Modal
    'checkout.title': 'Checkout Details',
    'checkout.delivery_info': 'Delivery Information',
    'checkout.mrn_placeholder': 'Medical Record Number (Optional)',
    'checkout.room_placeholder': 'Room Number (e.g. 402)',
    'checkout.floor': 'Select Floor',
    'checkout.location': 'Specific Unit/Location',
    'checkout.note': 'Order Note (Allergies, etc)',
    'checkout.coupon': 'Coupon Code',
    'checkout.apply': 'Apply',
    'checkout.advance': 'Advance Order (for Tomorrow)',
    'checkout.summary': 'Order Summary',
    'checkout.place_order': 'Place Order Now',
    'checkout.processing': 'Processing...',

    // Payment Page
    'payment.title': 'Complete Your Payment',
    'payment.summary': 'Order Summary',
    'payment.back': 'Back to Edit Order / Address',
    'payment.select_method': 'Select Payment Method',
    'payment.qris': 'Scan QRIS to Pay',
    'payment.transfer_details': 'Bank Transfer Details',
    'payment.cash_details': 'Cash Payment at Cashier',
    'payment.upload_receipt': 'Upload Transaction Receipt',
    'payment.submit': 'Submit Receipt',
    'payment.continue_cash': 'Continue Transaction',
    'payment.receipt_required': 'Please upload payment receipt',
    'payment.submitting': 'Sending order...',
  },
  id: {
    // Navigation
    'nav.order': 'Menu Pesan',
    'nav.my_orders': 'Pesanan Saya',
    'nav.payments': 'Pembayaran',
    'nav.kitchen': 'Pusat Dapur',
    'nav.server': 'Panel Server',
    'nav.validations': 'Validasi Kasir',
    'nav.reports': 'Laporan',
    'nav.manage_menus': 'Kelola Menu',
    'nav.manage_coupons': 'Kelola Kupon',
    'nav.add_doctor': 'Tambah Dokter',
    'nav.manage_staff': 'Kelola Staff',
    'nav.manage_locations': 'Kelola Lokasi',
    'nav.settings': 'Pengaturan',
    'nav.logout': 'Keluar',
    'nav.login': 'Masuk',
    'nav.signup': 'Daftar',

    // Common
    'common.search': 'Cari...',
    'common.loading': 'Memuat...',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.edit': 'Edit',
    'common.add': 'Tambah',
    'common.today': 'HARI INI',
    'common.back': 'Kembali',
    'common.confirm': 'Konfirmasi',
    'common.success': 'Berhasil',
    'common.error': 'Kesalahan',
    'common.greeting': 'Halo',

    // Roles
    'role.admin': 'ADMIN',
    'role.customer': 'PEMBELI',
    'role.doctor': 'DOKTER',
    'role.waiter': 'WAITER',
    'role.cashier': 'KASIR',
    'role.catering': 'DAPUR',
    'role.perawat': 'PERAWAT',

    // Kitchen Hub
    'kitchen.title': 'Pusat Dapur',
    'kitchen.open_monitor': 'Buka Monitor',
    'kitchen.new_tickets': 'Pesanan Baru',
    'kitchen.cooking': 'Sedang Dimasak',
    'kitchen.history': 'Riwayat',
    'kitchen.start_cooking': 'Mulai Masak',
    'kitchen.ready': 'Pesanan Siap',
    'kitchen.locked_tomorrow': 'Terkunci (Besok)',

    // Home Page
    'home.hero_title': 'Sistem Katering',
    'home.hero_highlight': 'Rumah Sakit',
    'home.hero_desc': 'Sistem Point-of-Sale canggih yang dibangun khusus untuk fasilitas kesehatan. Mengelola pesanan di muka untuk ruang operasi, pelacakan dapur real-time, dan pembayaran QRIS dalam satu platform terpadu.',
    'home.order_now': 'Pesan Sekarang',
    'home.login': 'Masuk ke Dashboard',
    'home.signup': 'Buat Akun Baru',
    'home.feature1_title': 'Pemesanan di Muka',
    'home.feature1_desc': 'Jadwalkan makanan hingga H-1 untuk ruang operasi dan unit prioritas khusus.',
    'home.feature2_title': 'Dapur Real-time',
    'home.feature2_desc': 'Monitoring Dashboard TV dari pesanan diterima hingga status pengiriman secara dinamis.',
    'home.feature3_title': 'Kemudahan Memesan',
    'home.feature3_desc': 'Antarmuka yang sederhana dan intuitif untuk pemesanan makanan cepat kapan saja.',

    // Order Page
    'order.title': 'Makanan Sehat & Lezat',
    'order.subtitle': 'Disiapkan segar untuk pasien, staf, dan pengunjung.',
    'order.categories': 'Kategori',
    'order.all': 'Semua',
    'order.food': 'Makanan',
    'order.drinks': 'Minuman',
    'order.snacks': 'Camilan',
    'order.cart': 'Keranjang Kamu',
    'order.empty_cart': 'Keranjang masih kosong',
    'order.checkout': 'Lanjut ke Pembayaran',
    'order.add_to_cart': 'Tambah ke Keranjang',
    'order.added': 'Ditambahkan',
    'order.qty': 'Jml',
    'order.total': 'Total',

    // Checkout Modal
    'checkout.title': 'Detail Pesanan',
    'checkout.delivery_info': 'Informasi Pengiriman',
    'checkout.mrn_placeholder': 'Nomor Rekam Medis (Opsional)',
    'checkout.room_placeholder': 'Nomor Kamar (Contoh: 402)',
    'checkout.floor': 'Pilih Lantai',
    'checkout.location': 'Unit / Lokasi Spesifik',
    'checkout.note': 'Catatan Pesanan (Alergi, dll)',
    'checkout.coupon': 'Kode Kupon',
    'checkout.apply': 'Gunakan',
    'checkout.advance': 'Pesan untuk Besok',
    'checkout.summary': 'Ringkasan Pesanan',
    'checkout.place_order': 'Pesan Sekarang',
    'checkout.processing': 'Memproses...',

    // Payment Page
    'payment.title': 'Selesaikan Pembayaran',
    'payment.summary': 'Ringkasan Pesanan',
    'payment.back': 'Kembali ke Edit Pesanan / Alamat',
    'payment.select_method': 'Pilih Metode Pembayaran',
    'payment.qris': 'Scan QRIS untuk Bayar',
    'payment.transfer_details': 'Detail Transfer Bank',
    'payment.cash_details': 'Pembayaran Tunai di Kasir',
    'payment.upload_receipt': 'Unggah Bukti Transaksi',
    'payment.submit': 'Kirim Bukti Pembayaran',
    'payment.continue_cash': 'Lanjut Transaksi',
    'payment.receipt_required': 'Harap unggah bukti pembayaran',
    'payment.submitting': 'Sedang mengirim pesanan...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'id' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
