import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("user", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // added for direct auth
  resetToken: text("resetToken"), // added for reset password testing
  resetTokenExpiry: integer("resetTokenExpiry", { mode: 'timestamp' }), // added for token expiration checking
  emailVerified: integer("emailVerified", { mode: 'boolean' }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).notNull(),
  role: text("role").default("customer").notNull(), // customer, catering, waiter, cashier
  employeeId: text("employeeId"), // doctor employee ID
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: 'timestamp' }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: integer("userId", { mode: 'number' })
    .notNull()
    .references(() => users.id),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: integer("userId", { mode: 'number' })
    .notNull()
    .references(() => users.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  password: text("password"),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: 'timestamp' }).notNull(),
});

export const orders = sqliteTable("order", {
  id: text("id").primaryKey(), // We'll manage UUID/random strings in code
  userId: integer("userId", { mode: 'number' }).notNull().references(() => users.id),
  totalAmount: real("totalAmount").notNull(),
  deliveryType: text("deliveryType").notNull().default("immediate"), // immediate, advance
  status: text("status").notNull().default("received"), // received, created, preparing, ready, delivering, delivered
  orderDate: integer("orderDate", { mode: 'timestamp' }).notNull(),
  expectedDate: integer("expectedDate", { mode: 'timestamp' }).notNull(),
  isPaid: integer("isPaid", { mode: 'boolean' }).notNull().default(false),
  paymentMethod: text("paymentMethod"), // transfer, qris
  receiptImageUrl: text("receiptImageUrl"),
  deliveryProofUrl: text("deliveryProofUrl"),
  cancelReason: text("cancelReason"),
  validatedAt: integer("validatedAt", { mode: 'timestamp' }),
  preparingAt: integer("preparingAt", { mode: 'timestamp' }),
  readyAt: integer("readyAt", { mode: 'timestamp' }),
  deliveringAt: integer("deliveringAt", { mode: 'timestamp' }),
  deliveredAt: integer("deliveredAt", { mode: 'timestamp' }),
  description: text("description"),
  mrn: text("mrn"),
  orderType: text("orderType").default("customer").notNull(), // customer, doctor
  floor: text("floor"),
  location: text("location"),
  roomNumber: text("roomNumber"),
  reviewText: text("reviewText"),
});

export const orderItems = sqliteTable("orderItem", {
  id: text("id").primaryKey(),
  orderId: text("orderId").notNull().references(() => orders.id),
  productId: text("productId"),
  productName: text("productName").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const menus = sqliteTable("menu", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // food, drink, snack
  price: real("price").notNull(),
  imageUrl: text("imageUrl"),
  menuType: text("menuType").default("customer").notNull(), // customer, doctor
  rating: real("rating").default(0),
  reviews: integer("reviews").default(0),
});

export const favorites = sqliteTable("favorite", {
  id: text("id").primaryKey(),
  userId: integer("userId", { mode: 'number' }).notNull().references(() => users.id),
  menuId: text("menuId").notNull().references(() => menus.id),
});
