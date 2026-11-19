import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const garments = pgTable("garments", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  lotLabel: text("lot_label").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceKobo: integer("price_kobo").notNull(), // Stored in NGN kobo (e.g. 6500000 = NGN 65,000)
  fabric: text("fabric").notNull(),
  weightGsm: text("weight_gsm").notNull(),
  fit: text("fit").notNull(),
  sortOrder: integer("sort_order").notNull().default(1),
  frontImgUrl: text("front_img_url").notNull(),
  sideImgUrl: text("side_img_url").notNull(),
  backImgUrl: text("back_img_url").notNull(),
  foldedImgUrl: text("folded_img_url").notNull(),
  onModelImgUrl: text("on_model_img_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const garmentVariants = pgTable("garment_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  garmentId: uuid("garment_id")
    .notNull()
    .references(() => garments.id, { onDelete: "cascade" }),
  size: text("size").notNull(), // S | M | L | XL
  chestSpec: text("chest_spec").notNull(),
  lengthSpec: text("length_spec").notNull(),
  stockQty: integer("stock_qty").notNull().default(10),
});

export const bagSessions = pgTable("bag_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bagItems = pgTable("bag_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => bagSessions.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => garmentVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => bagSessions.id),
  paystackReference: text("paystack_reference").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  deliveryAddress: text("delivery_address"),
  totalKobo: integer("total_kobo").notNull(),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dropSubscribers = pgTable("drop_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
