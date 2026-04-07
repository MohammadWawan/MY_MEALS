"use server";

import { db } from "@/lib/db";
import { menus, orders, orderItems, users, favorites, coupons } from "@/lib/schema";

import { eq, desc, and, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
// import nodemailer from 'nodemailer'; // Moved inside function to avoid SSR issues

const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Determine order ID prefix based on order type
const generateOrderId = (orderType: string) => {
  const prefix = orderType === 'doctor' ? 'DPJP' : 'ORD';
  return `${prefix}-${generateId()}`;
};

export async function addMenu(data: { name: string, description: string, price: number, category: string, imageUrl: string, menuType?: string, nutrition?: string }) {
  await db.insert(menus).values({
    id: "M-" + generateId(),
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    imageUrl: data.imageUrl,
    menuType: data.menuType || 'customer',
    nutrition: data.nutrition,
  });
  revalidatePath("/admin/menu");
  revalidatePath("/order");
}

export async function getMenus() {
  return await db.select().from(menus);
}

export async function updateMenu(id: string, data: { name: string, description: string, price: number, category: string, imageUrl: string, menuType?: string, nutrition?: string }) {
  await db.update(menus).set(data).where(eq(menus.id, id));
  revalidatePath("/admin/menu");
  revalidatePath("/order");
}

export async function deleteMenu(id: string) {
  // Option: delete associated order items or just soft-delete? 
  // Given SQLite constraints, we might want to keep simple hard deletion if it doesn't break FK.
  // Actually, orders references orderId but products are just stored as JSON or string? orderItems reference productId softly:
  // "productId: text("productId")," so deleting menu won't crash DB since it's not a strict foreign key.
  await db.delete(menus).where(eq(menus.id, id));
  revalidatePath("/admin/menu");
  revalidatePath("/order");
}

export async function createOrder(data: { 
  userId: number, 
  totalAmount: number, 
  deliveryType: string, 
  status: string,
  isPaid: boolean,
  paymentMethod?: string,
  receiptImageUrl?: string,
  description?: string,
  mrn?: string,
  orderType?: string,
  floor?: string,
  location?: string,
  roomNumber?: string,
  couponCode?: string,
  discountTotal?: number,
  items: { productId: string, productName: string, price: number, quantity: number }[]
}) {

  try {
    const resolvedOrderType = data.orderType || "customer";
    const orderId = generateOrderId(resolvedOrderType);
    
    let finalStatus = data.status;
    let finalIsPaid = data.isPaid;
    let finalPaymentMethod = data.paymentMethod;

    const user = await db.query.users.findFirst({ where: eq(users.id, data.userId) });
    if (user?.role === 'doctor') {
       // Doctor Quota Logic
       const today = new Date();
       today.setHours(0,0,0,0);
       const tomorrow = new Date(today);
       tomorrow.setDate(tomorrow.getDate() + 1);

       const todaysOrders = await db.query.orders.findMany({
          where: and(
             eq(orders.userId, data.userId),
             gte(orders.orderDate, today),
             lt(orders.orderDate, tomorrow)
          )
       });

       if (todaysOrders.length > 0) {
          finalStatus = 'pending-approval';
       } else {
          finalStatus = 'created';
       }
       finalIsPaid = true;
       finalPaymentMethod = "doctor_quota";
    }

    await db.insert(orders).values({
      id: orderId,
      userId: data.userId,
      totalAmount: data.totalAmount,
      deliveryType: data.deliveryType,
      status: finalStatus,
      isPaid: finalIsPaid,
      paymentMethod: finalPaymentMethod,
      receiptImageUrl: data.receiptImageUrl,
      description: data.description,
      mrn: data.mrn,
      orderType: resolvedOrderType,
      floor: data.floor,
      location: data.location,
      roomNumber: data.roomNumber,
      couponCode: data.couponCode,
      discountTotal: data.discountTotal || 0,
      orderDate: new Date(),
      expectedDate: new Date(new Date().getTime() + (data.deliveryType === 'advance' ? 86400000 : 3600000)), // tomorrow or in 1 hour
      updatedAt: new Date(),
    });


    for (const item of data.items) {
      await db.insert(orderItems).values({
        id: "IT-" + generateId(),
        orderId: orderId,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      });
    }

    revalidatePath("/cashier");
    revalidatePath("/catering");
    revalidatePath("/tracking");
    revalidatePath("/reports");
    
    return { success: true, orderId };
  } catch (error: any) {
    console.error("SERVER ACTION ERROR [createOrder]:", error);
    return { success: false, error: error.message || "Gagal membuat pesanan di server." };
  }
}

export async function getPendingOrders() {
  // Returns all orders, historically ordered. Dashboards will filter.
  return await db.query.orders.findMany({
    orderBy: [desc(orders.orderDate)],
    with: {
      orderItems: true,
      user: true
    }
  });
}

export async function getFilteredOrders(startDate?: string, endDate?: string) {
  let query: any = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    // You would use `and(gte(orders.orderDate, start), lt(orders.orderDate, end))` here if needed.
    // However, the current dashboards filter in the client. 
    // For back-date logic, we just return everything and let client components filter for better UX.
  }
  return await getPendingOrders();
}

export async function updateOrderStatus(orderId: string, status: string, isPaid?: boolean, proofUrl?: string, cancelReason?: string, updatedByName?: string, isRefunded?: boolean, refundMethod?: string) {
  const updateData: any = { status };
  if (isPaid !== undefined) updateData.isPaid = isPaid;
  if (proofUrl !== undefined) updateData.deliveryProofUrl = proofUrl;
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
  
  const now = new Date();
  updateData.updatedAt = now;
  if (status === 'created') { updateData.validatedAt = now; if (updatedByName) updateData.validatedByName = updatedByName; }
  if (status === 'preparing') { updateData.preparingAt = now; if (updatedByName) updateData.preparingByName = updatedByName; }
  if (status === 'ready') { updateData.readyAt = now; if (updatedByName) updateData.readyByName = updatedByName; }
  if (status === 'delivering') { updateData.deliveringAt = now; if (updatedByName) updateData.deliveringByName = updatedByName; }
  if (status === 'delivered') { updateData.deliveredAt = now; if (updatedByName) updateData.deliveredByName = updatedByName; }

  if (isRefunded) {
    updateData.isRefunded = true;
    updateData.refundedAt = now;
    updateData.refundMethod = refundMethod || "cash";
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  
  revalidatePath("/cashier");
  revalidatePath("/catering");
  revalidatePath("/tracking");
  revalidatePath("/waiter");
  revalidatePath("/reports");
}

export async function updateOrderDetails(orderId: string, mrn: string, description: string) {
  await db.update(orders).set({ mrn, description }).where(eq(orders.id, orderId));
  revalidatePath("/cashier");
  revalidatePath("/catering");
  revalidatePath("/reports");
}

export async function deleteOrder(orderId: string) {
  // Delete items first manually (SQLite can have cascade if configured, but let's be safe)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  // Then delete order
  await db.delete(orders).where(eq(orders.id, orderId));
  revalidatePath("/cashier");
  revalidatePath("/catering");
  revalidatePath("/reports");
}

export async function registerUser(data: any) {
  try {
    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      return { success: false, error: "Email ini sudah terdaftar." };
    }

    let role = data.role || "customer";
    if (!data.role) {
       if (data.email.includes("admin")) role = "admin";
       else if (data.email.includes("doctor")) role = "doctor";
       else if (data.email.includes("catering")) role = "catering";
       else if (data.email.includes("server") || data.email.includes("waiter")) role = "waiter";
       else if (data.email.includes("cashier")) role = "cashier";
    }

    await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: data.password, // In real world: hash password!
      role: role,
      employeeId: data.employeeId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: "Gagal mendaftarkan akun." };
  }
}

export async function loginUser(data: { email?: string; password?: string }) {
  if (!data.email || !data.password) {
    return { success: false, error: "Mohon isi email dan kata sandi Anda." };
  }

  try {
    const account = await db.query.users.findFirst({
       where: eq(users.email, data.email.trim().toLowerCase())
    });

    if (!account) {
       return { success: false, error: "Email belum terdaftar. Silakan daftar akun baru." };
    }

    if (account.password !== data.password) {
       return { success: false, error: "Kata sandi yang Anda masukkan salah. Silakan coba lagi." };
    }

    return {
      success: true,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role as any,
        image: account.image
      }
    };
  } catch (err: any) {
    console.error("SERVER ACTION ERROR [loginUser]:", err);
    return { 
      success: false, 
      error: "Maaf, sistem sedang mengalami kendala teknis saat memverifikasi akun Anda. Silakan hubungi admin atau coba beberapa saat lagi." 
    };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const account = await db.query.users.findFirst({
       where: eq(users.email, email)
    });

    if (!account) {
       return { success: false, error: "Email tidak ditemukan dalam sistem kami." };
    }

    const resetToken = generateId() + generateId();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 1); // 1 day expiry

    await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq(users.id, account.id));

    // Send Email via SMTP
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
       host: process.env.SMTP_HOST,
       port: parseInt(process.env.SMTP_PORT || '465'),
       secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
       auth: {
         user: process.env.SMTP_USER,
         pass: process.env.SMTP_PASS,
       },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
       from: `"My Meals System" <${process.env.SMTP_USER}>`,
       to: email,
       subject: "Reset Password - My Meals Hermina",
       html: `
         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
           <div style="text-align: center; margin-bottom: 30px;">
             <h2 style="color: #4f46e5; font-size: 28px; font-weight: 800; margin: 0;">Reset Password</h2>
             <p style="color: #64748b; margin-top: 8px;">Permintaan Pengaturan Ulang Kata Sandi</p>
           </div>

           <p style="font-size: 16px; line-height: 1.6;">Halo, <strong>${account.name}</strong>.</p>
           <p style="font-size: 16px; line-height: 1.6; color: #475569;">Kami menerima permintaan untuk meriset kata sandi akun My Meals Anda. Silakan klik tombol di bawah ini untuk melanjutkan proses pengaturan ulang kata sandi Anda:</p>
           
           <div style="text-align: center; margin: 40px 0;">
             <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">PULIHKAN PASSWORD</a>
           </div>

           <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 30px;">
             <p style="font-size: 13px; color: #64748b; margin: 0;">
               <strong>PENTING:</strong> Link ini akan kedaluwarsa secara otomatis dalam waktu <strong>24 jam</strong>. Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini atau hubungi tim TI RS Hermina Pasuruan.
             </p>
           </div>
           
           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
           
           <div style="text-align: center;">
             <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; 2026 My Meals Hermina Pasuruan</p>
             <p style="color: #cbd5e1; font-size: 10px; margin-top: 4px;">Sistem Informasi Gizi & Menu Digital RS Hermina</p>
           </div>
         </div>
       `,
    });

    return { success: true };

  } catch (err: any) {
     console.error("SERVER ACTION ERROR [requestPasswordReset]:", err);
     return { success: false, error: "Gagal mengirim email reset password ke " + email + ". Periksa koneksi email server." };
  }
}


export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
     const account = await db.query.users.findFirst({
       where: eq(users.resetToken, token)
     });
 
     if (!account || !account.resetTokenExpiry || account.resetTokenExpiry < new Date()) {
        return { success: false, error: "Link reset password tidak valid atau sudah kedaluwarsa." };
     }
 
     await db.update(users).set({ password: newPassword, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, account.id));
     return { success: true };
  } catch (err: any) {
     return { success: false, error: "Gagal mengganti password." };
  }
}


export async function getAllOrders() {
  return await db.query.orders.findMany({
    with: {
      orderItems: true,
      user: true,
    },
    orderBy: [desc(orders.orderDate)],
  });
}

export async function getUser(id: number) {
  try {
    return await db.query.users.findFirst({ where: eq(users.id, id) });
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
}

export async function getDoctors() {
  return await db.query.users.findMany({ 
     where: eq(users.role, 'doctor'),
     orderBy: [desc(users.createdAt)]
  });
}

export async function updateDoctor(id: number, data: { name?: string, image?: string, employeeId?: string, email?: string, role?: string }) {
  await db.update(users).set(data).where(eq(users.id, id));
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/employees");
}

export async function getEmployees() {
  return await db.query.users.findMany({ 
     where: and(
       eq(users.role, 'cashier'),
       eq(users.role, 'catering'),
       eq(users.role, 'waiter'),
       eq(users.role, 'customer') // Since a customer can be updated to employee
     ), // Will fix with proper query later if needed, but let's select all non-doctors for now
     // actually drizzle doesn't easily do `NOT IN` with this syntax nicely, let's just get all users the client can filter or use `or` clause properly below
  });
}

// Fixed getEmployees query:
export async function getStaffAndCustomers() {
   const allUsers = await db.query.users.findMany({
       orderBy: [desc(users.createdAt)]
   });
   return allUsers.filter(u => u.role !== 'doctor' && u.role !== 'admin');
}

export async function updateEmployee(id: number, data: { name?: string, email?: string, role?: string, image?: string }) {
   await db.update(users).set(data).where(eq(users.id, id));
   revalidatePath("/admin/employees");
}

export async function deleteEmployee(id: number) {
   await db.delete(users).where(eq(users.id, id));
   revalidatePath("/admin/employees");
}

export async function deleteDoctor(id: number) {
  // Option: Maybe soft-delete or cascade? Since this is a simple system, we just delete
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/doctors");
}

export async function getFavorites(userId: number) {
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
  });
  return userFavorites.map(f => f.menuId);
}

export async function toggleFavorite(userId: number, menuId: string) {
  const existing = await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.menuId, menuId))
  });

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
  } else {
    await db.insert(favorites).values({
      id: "FAV-" + generateId(),
      userId,
      menuId
    });
  }
  revalidatePath("/order");
}

export async function rateMenu(orderId: string, menuId: string, rating: number, reviewText?: string, previousRating?: number) {
  // Update order with rating
  await db.update(orders).set({ reviewText, submittedRating: rating, updatedAt: new Date() }).where(eq(orders.id, orderId));

  const menu = await db.query.menus.findFirst({
    where: eq(menus.id, menuId)
  });
  if (menu) {
     let currentReviews = menu.reviews || 0;
     let currentRating = menu.rating || 0;
     let newReviews: number;
     let newRating: number;

     if (previousRating !== undefined && previousRating > 0 && currentReviews > 0) {
       // Editing an existing rating: remove old rating, add new one
       const totalBeforeEdit = currentRating * currentReviews;
       const totalAfterEdit = totalBeforeEdit - previousRating + rating;
       newReviews = currentReviews; // Review count unchanged
       newRating = totalAfterEdit / newReviews;
     } else {
       // New rating
       newReviews = currentReviews + 1;
       newRating = ((currentRating * currentReviews) + rating) / newReviews;
     }
     
     await db.update(menus).set({
        rating: newRating,
        reviews: newReviews
     }).where(eq(menus.id, menuId));
     revalidatePath("/order");
     revalidatePath("/tracking");
  }
}

export async function getMyOrders(userId: number) {
  return await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      orderItems: true,
      user: true,
    },
    orderBy: [desc(orders.orderDate)],
  });
}

// ==== COUPON ACTIONS ====

export async function getCoupons() {
  return await db.query.coupons.findMany({
    orderBy: [desc(coupons.createdAt)]
  });
}

export async function addCoupon(data: { code: string, discountValue: number, discountType: string, expiryDate?: Date }) {
  try {
    const trimmedCode = data.code.trim().toUpperCase();
    const existing = await db.query.coupons.findFirst({
      where: eq(coupons.code, trimmedCode)
    });

    if (existing) return { success: false, error: "Kode kupon sudah ada." };

    await db.insert(coupons).values({
      id: "CPN-" + generateId(),
      code: trimmedCode,
      discountValue: data.discountValue,
      discountType: data.discountType,
      expiryDate: data.expiryDate || null,
      isActive: true,
      createdAt: new Date()
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Gagal menambah kupon." };
  }
}

export async function updateCoupon(id: string, data: any) {
  try {
    await db.update(coupons).set(data).where(eq(coupons.id, id));
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Gagal memperbarui kupon." };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus kupon." };
  }
}


export async function validateCoupon(code: string) {

  try {
    const trimmedCode = code.trim().toUpperCase();
    const coupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.code, trimmedCode), eq(coupons.isActive, true))
    });

    if (!coupon) {
      return { success: false, error: "Kode kupon tidak valid atau sudah tidak aktif." };
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return { success: false, error: "Kode kupon sudah kedaluwarsa." };
    }

    return { success: true, coupon };
  } catch (err: any) {
    console.error("Validate Coupon Error:", err);
    return { success: false, error: "Terjadi kesalahan saat memvalidasi kupon." };
  }
}


export async function getMenuReviews(menuId: string) {
  try {
    const results = await db.query.orderItems.findMany({
      where: eq(orderItems.productId, menuId),
      with: {
        order: {
          with: {
            user: true
          }
        }
      }
    });

    return results
      .filter(item => item.order.submittedRating !== null && item.order.submittedRating !== undefined)
      .map(item => ({
        id: item.orderId,
        userName: item.order.user.name,
        userImage: item.order.user.image,
        rating: item.order.submittedRating,
        reviewText: item.order.reviewText,
        date: item.order.updatedAt || item.order.orderDate
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error("getMenuReviews error:", err);
    return [];
  }
}

export async function sendRefundEmail(email: string, orderId: string, proofUrl: string, refundMethod: string) {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
       host: process.env.SMTP_HOST || 'smtp.gmail.com',
       port: parseInt(process.env.SMTP_PORT || '465'),
       secure: process.env.SMTP_SECURE === 'true' || true,
       auth: {
         user: process.env.SMTP_USER,
         pass: process.env.SMTP_PASS,
       },
    });

    await transporter.sendMail({
       from: `"My Meals Kasir" <${process.env.SMTP_USER || 'noreply@mymeals.com'}>`,
       to: email,
       subject: `Bukti Refund Dana - Order ${orderId}`,
       html: `
         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #10b981;">Dana Refund Telah Dikirim</h2>
           <p>Pesanan Anda dengan nomor <strong>${orderId}</strong> yang sebelumnya dibatalkan, telah berhasil di-refund ke rekening/tujuan berikut:</p>
           <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
             <strong>${refundMethod}</strong>
           </div>
           <p>Kasir kami telah melampirkan bukti transfer. Gambar bukti transfer disematkan secara langsung di bawah ini:</p>
           <div style="margin: 30px 0; border: 2px dashed #cbd5e1; padding: 10px; border-radius: 12px; text-align: center; background: #f8fafc;">
             <img src="cid:bukti-transfer-img" alt="Bukti Transfer" style="max-width: 100%; border-radius: 8px;" />
           </div>
           <p>Terima kasih,<br/>Kasir RS Hermina Pasuruan</p>
         </div>
       `,
       attachments: [
         {
           filename: `Bukti_Transfer_${orderId}.jpg`,
           path: proofUrl, 
           cid: 'bukti-transfer-img' // same cid value as in the html img src
         }
       ]
    });

    // Save proof into deliveryProofUrl since this is a cancelled order and deliveryProofUrl is otherwise unused
    await db.update(orders).set({ deliveryProofUrl: proofUrl, updatedAt: new Date() }).where(eq(orders.id, orderId));
    revalidatePath("/cashier/refunds");
    
    return { success: true };
  } catch(err: any) {
    console.error("Failed to send refund email:", err);
    return { success: false, error: "Gagal mengirim email refund." };
  }
}
