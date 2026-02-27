"use server";

import { db } from "@/lib/db";
import { menus, orders, orderItems, users, favorites } from "@/lib/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Determine order ID prefix based on order type
const generateOrderId = (orderType: string) => {
  const prefix = orderType === 'doctor' ? 'DPJP' : 'ORD';
  return `${prefix}-${generateId()}`;
};

export async function addMenu(data: { name: string, description: string, price: number, category: string, imageUrl: string, menuType?: string }) {
  await db.insert(menus).values({
    id: "M-" + generateId(),
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    imageUrl: data.imageUrl,
    menuType: data.menuType || 'customer',
  });
  revalidatePath("/admin/menu");
  revalidatePath("/order");
}

export async function getMenus() {
  return await db.select().from(menus);
}

export async function updateMenu(id: string, data: { name: string, description: string, price: number, category: string, imageUrl: string, menuType?: string }) {
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
  items: { productId: string, productName: string, price: number, quantity: number }[]
}) {
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
    orderDate: new Date(),
    expectedDate: new Date(new Date().getTime() + (data.deliveryType === 'advance' ? 86400000 : 3600000)), // tomorrow or in 1 hour
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
  return orderId;
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

export async function updateOrderStatus(orderId: string, status: string, isPaid?: boolean, proofUrl?: string, cancelReason?: string) {
  const updateData: any = { status };
  if (isPaid !== undefined) updateData.isPaid = isPaid;
  if (proofUrl !== undefined) updateData.deliveryProofUrl = proofUrl;
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
  
  const now = new Date();
  if (status === 'created') updateData.validatedAt = now;
  if (status === 'preparing') updateData.preparingAt = now;
  if (status === 'ready') updateData.readyAt = now;
  if (status === 'delivering') updateData.deliveringAt = now;
  if (status === 'delivered') updateData.deliveredAt = now;

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
  let role = data.role || "customer";
  // Override via keyword if role not explicitly requested (for easy dev)
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
}

export async function loginUser(data: any) {
  const account = await db.query.users.findFirst({
     where: eq(users.email, data.email)
  });

  if (!account || account.password !== data.password) {
     throw new Error("Invalid credentials");
  }

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role as any,
    image: account.image
  };
}

export async function requestPasswordReset(email: string) {
  const account = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!account) throw new Error("Email not found");

  const resetToken = generateId() + generateId();
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 1); // 1 day expiry

  await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq(users.id, account.id));

  // In real world: Send email here
  return { token: resetToken };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const account = await db.query.users.findFirst({
    where: eq(users.resetToken, token)
  });

  if (!account || !account.resetTokenExpiry || account.resetTokenExpiry < new Date()) {
     throw new Error("Invalid or expired token");
  }

  await db.update(users).set({ password: newPassword, resetToken: null }).where(eq(users.id, account.id));
  return { success: true };
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
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getDoctors() {
  return await db.query.users.findMany({ 
     where: eq(users.role, 'doctor'),
     orderBy: [desc(users.createdAt)]
  });
}

export async function updateDoctor(id: number, data: { name?: string, image?: string, employeeId?: string }) {
  await db.update(users).set(data).where(eq(users.id, id));
  revalidatePath("/admin/doctors");
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
  await db.update(orders).set({ reviewText }).where(eq(orders.id, orderId));

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

