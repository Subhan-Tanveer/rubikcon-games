import { pgTable, text, serial, integer, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in kobo (Nigerian currency)
  category: text("category").notNull(), // 'card' or 'online'
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  isOnline: integer("is_online").notNull().default(0), // 0 for card games, 1 for online games
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  gameId: integer("game_id").notNull().references(() => games.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  customerInfo: jsonb("customer_info").$type<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    state: string;
  }>().notNull(),
  items: jsonb("items").$type<Array<{
    gameId: number;
    title: string;
    price: number;
    quantity: number;
  }>>().notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameSchema = createInsertSchema(games, {
  images: z.array(z.string()),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

const orderItemSchema = z.object({
  gameId: z.number(),
  title: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export const insertOrderSchema = createInsertSchema(orders, {
  items: z.array(orderItemSchema),
}).omit({
  id: true,
  createdAt: true,
});

export type Game = typeof games.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
