import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").default("salesperson").notNull(), // salesperson, admin, manager
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true
});

// Vendors (manufacturers)
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  isApproved: boolean("is_approved").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull(),
  minStock: integer("min_stock").default(10),
  sku: text("sku").notNull().unique(),
  gstRate: doublePrecision("gst_rate").default(0).notNull(),
  vendorId: integer("vendor_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
  isActive: true
});

// Supplier/Vendor schema
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  paymentTerms: text("payment_terms").notNull(),
  pricingInfo: text("pricing_info").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true
});

// Distributors
export const distributors = pgTable("distributors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  region: text("region").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDistributorSchema = createInsertSchema(distributors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true
});

// Retailers
export const retailers = pgTable("retailers", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  distributorId: integer("distributor_id"),
  isApproved: boolean("is_approved").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRetailerSchema = createInsertSchema(retailers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true
});

// Billed-To Entities
export const billedEntities = pgTable("billed_entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  type: text("type").notNull(), // company, individual, government, etc.
  isApproved: boolean("is_approved").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBilledEntitySchema = createInsertSchema(billedEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true
});

// Purchase schema
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseOrderNumber: text("purchase_order_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  totalTax: doublePrecision("total_tax").notNull(),
  status: text("status").notNull().default("pending"), // pending, shipping, packaging, received
  expectedDelivery: timestamp("expected_delivery"),
  items: jsonb("items").notNull(), // Array of items with product ID, quantity, price
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Sales schema
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  salespersonId: integer("salesperson_id").notNull(),
  retailerId: integer("retailer_id").notNull(),
  billedEntityId: integer("billed_entity_id").notNull(),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  totalTax: doublePrecision("total_tax").notNull(),
  items: jsonb("items").notNull(), // Array of items with product ID, quantity, price
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partially paid
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  signature: text("signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Invoice templates
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  template: text("template").notNull(), // HTML or JSON template
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Approval requests for entities that need admin approval
export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // distributor, vendor, retailer, billedEntity
  entityId: integer("entity_id").notNull(),
  requestedBy: integer("requested_by").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
});

// Define relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

export const retailersRelations = relations(retailers, ({ one, many }) => ({
  distributor: one(distributors, {
    fields: [retailers.distributorId],
    references: [distributors.id],
  }),
  sales: many(sales),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  salesperson: one(users, {
    fields: [sales.salespersonId],
    references: [users.id],
  }),
  retailer: one(retailers, {
    fields: [sales.retailerId],
    references: [retailers.id],
  }),
  billedEntity: one(billedEntities, {
    fields: [sales.billedEntityId],
    references: [billedEntities.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Distributor = typeof distributors.$inferSelect;
export type InsertDistributor = z.infer<typeof insertDistributorSchema>;

export type Retailer = typeof retailers.$inferSelect;
export type InsertRetailer = z.infer<typeof insertRetailerSchema>;

export type BilledEntity = typeof billedEntities.$inferSelect;
export type InsertBilledEntity = z.infer<typeof insertBilledEntitySchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;