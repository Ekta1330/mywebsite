import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  suppliers, type Supplier, type InsertSupplier,
  purchases, type Purchase, type InsertPurchase,
  sales, type Sale, type InsertSale,
  vendors, type Vendor, type InsertVendor,
  distributors, type Distributor, type InsertDistributor,
  retailers, type Retailer, type InsertRetailer,
  billedEntities, type BilledEntity, type InsertBilledEntity,
  invoiceTemplates, type InvoiceTemplate, type InsertInvoiceTemplate,
  approvalRequests, type ApprovalRequest, type InsertApprovalRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, desc, sql } from "drizzle-orm";
import { SessionOptions } from "express-session";
import connect_pg_simple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connect_pg_simple(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  updateProductStock(id: number, change: number): Promise<Product | undefined>;
  
  // Supplier operations
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getApprovedVendors(): Promise<Vendor[]>;
  
  // Distributor operations
  getDistributor(id: number): Promise<Distributor | undefined>;
  createDistributor(distributor: InsertDistributor): Promise<Distributor>;
  updateDistributor(id: number, distributor: Partial<InsertDistributor>): Promise<Distributor | undefined>;
  getAllDistributors(): Promise<Distributor[]>;
  getApprovedDistributors(): Promise<Distributor[]>;
  
  // Retailer operations
  getRetailer(id: number): Promise<Retailer | undefined>;
  createRetailer(retailer: InsertRetailer): Promise<Retailer>;
  updateRetailer(id: number, retailer: Partial<InsertRetailer>): Promise<Retailer | undefined>;
  getAllRetailers(): Promise<Retailer[]>;
  getApprovedRetailers(): Promise<Retailer[]>;
  
  // Billed Entity operations
  getBilledEntity(id: number): Promise<BilledEntity | undefined>;
  createBilledEntity(entity: InsertBilledEntity): Promise<BilledEntity>;
  updateBilledEntity(id: number, entity: Partial<InsertBilledEntity>): Promise<BilledEntity | undefined>;
  getAllBilledEntities(): Promise<BilledEntity[]>;
  getApprovedBilledEntities(): Promise<BilledEntity[]>;
  
  // Purchase operations
  getPurchase(id: number): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: number): Promise<boolean>;
  getAllPurchases(): Promise<Purchase[]>;
  
  // Sale operations
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  getAllSales(): Promise<Sale[]>;
  getSalesBySalesperson(salespersonId: number): Promise<Sale[]>;
  
  // Invoice Template operations
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  getDefaultInvoiceTemplate(): Promise<InvoiceTemplate | undefined>;
  getAllInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  
  // Approval Request operations
  getApprovalRequest(id: number): Promise<ApprovalRequest | undefined>;
  createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest>;
  updateApprovalRequest(id: number, request: Partial<ApprovalRequest>): Promise<ApprovalRequest | undefined>;
  getAllApprovalRequests(): Promise<ApprovalRequest[]>;
  getPendingApprovalRequests(): Promise<ApprovalRequest[]>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: "sessions"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: now,
      updatedAt: now,
      isActive: true
    }).returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        ...userUpdate,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isActive, true));
  }
  
  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const now = new Date();
    const [product] = await db.insert(products).values({
      ...insertProduct,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    return product;
  }
  
  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({
        ...productUpdate,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const [product] = await db.update(products)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return !!product;
  }
  
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isActive, true));
  }
  
  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    if (threshold) {
      return db.select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            lte(products.stock, threshold)
          )
        );
    } else {
      return db.select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.stock} <= ${products.minStock}`
          )
        );
    }
  }
  
  async updateProductStock(id: number, change: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({
        stock: sql`${products.stock} + ${change}`,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  // Supplier operations
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const now = new Date();
    const [supplier] = await db.insert(suppliers).values({
      ...insertSupplier,
      isActive: true,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return supplier;
  }
  
  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers)
      .set({
        ...supplierUpdate,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    const [supplier] = await db.update(suppliers)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, id))
      .returning();
    return !!supplier;
  }
  
  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.isActive, true));
  }
  
  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }
  
  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const now = new Date();
    const [vendor] = await db.insert(vendors).values({
      ...insertVendor,
      isActive: true,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return vendor;
  }
  
  async updateVendor(id: number, vendorUpdate: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [vendor] = await db.update(vendors)
      .set({
        ...vendorUpdate,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }
  
  async getAllVendors(): Promise<Vendor[]> {
    return db.select().from(vendors).where(eq(vendors.isActive, true));
  }
  
  async getApprovedVendors(): Promise<Vendor[]> {
    return db.select().from(vendors).where(
      and(
        eq(vendors.isActive, true),
        eq(vendors.isApproved, true)
      )
    );
  }
  
  // Distributor operations
  async getDistributor(id: number): Promise<Distributor | undefined> {
    const [distributor] = await db.select().from(distributors).where(eq(distributors.id, id));
    return distributor;
  }
  
  async createDistributor(insertDistributor: InsertDistributor): Promise<Distributor> {
    const now = new Date();
    const [distributor] = await db.insert(distributors).values({
      ...insertDistributor,
      isActive: true,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return distributor;
  }
  
  async updateDistributor(id: number, distributorUpdate: Partial<InsertDistributor>): Promise<Distributor | undefined> {
    const [distributor] = await db.update(distributors)
      .set({
        ...distributorUpdate,
        updatedAt: new Date()
      })
      .where(eq(distributors.id, id))
      .returning();
    return distributor;
  }
  
  async getAllDistributors(): Promise<Distributor[]> {
    return db.select().from(distributors).where(eq(distributors.isActive, true));
  }
  
  async getApprovedDistributors(): Promise<Distributor[]> {
    return db.select().from(distributors).where(
      and(
        eq(distributors.isActive, true),
        eq(distributors.isApproved, true)
      )
    );
  }
  
  // Retailer operations
  async getRetailer(id: number): Promise<Retailer | undefined> {
    const [retailer] = await db.select().from(retailers).where(eq(retailers.id, id));
    return retailer;
  }
  
  async createRetailer(insertRetailer: InsertRetailer): Promise<Retailer> {
    const now = new Date();
    const [retailer] = await db.insert(retailers).values({
      ...insertRetailer,
      isActive: true,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return retailer;
  }
  
  async updateRetailer(id: number, retailerUpdate: Partial<InsertRetailer>): Promise<Retailer | undefined> {
    const [retailer] = await db.update(retailers)
      .set({
        ...retailerUpdate,
        updatedAt: new Date()
      })
      .where(eq(retailers.id, id))
      .returning();
    return retailer;
  }
  
  async getAllRetailers(): Promise<Retailer[]> {
    return db.select().from(retailers).where(eq(retailers.isActive, true));
  }
  
  async getApprovedRetailers(): Promise<Retailer[]> {
    return db.select().from(retailers).where(
      and(
        eq(retailers.isActive, true),
        eq(retailers.isApproved, true)
      )
    );
  }
  
  // Billed Entity operations
  async getBilledEntity(id: number): Promise<BilledEntity | undefined> {
    const [entity] = await db.select().from(billedEntities).where(eq(billedEntities.id, id));
    return entity;
  }
  
  async createBilledEntity(insertEntity: InsertBilledEntity): Promise<BilledEntity> {
    const now = new Date();
    const [entity] = await db.insert(billedEntities).values({
      ...insertEntity,
      isActive: true,
      isApproved: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return entity;
  }
  
  async updateBilledEntity(id: number, entityUpdate: Partial<InsertBilledEntity>): Promise<BilledEntity | undefined> {
    const [entity] = await db.update(billedEntities)
      .set({
        ...entityUpdate,
        updatedAt: new Date()
      })
      .where(eq(billedEntities.id, id))
      .returning();
    return entity;
  }
  
  async getAllBilledEntities(): Promise<BilledEntity[]> {
    return db.select().from(billedEntities).where(eq(billedEntities.isActive, true));
  }
  
  async getApprovedBilledEntities(): Promise<BilledEntity[]> {
    return db.select().from(billedEntities).where(
      and(
        eq(billedEntities.isActive, true),
        eq(billedEntities.isApproved, true)
      )
    );
  }
  
  // Purchase operations
  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }
  
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const now = new Date();
    const [purchase] = await db.insert(purchases).values({
      ...insertPurchase,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    // Update product stocks based on purchase
    if (Array.isArray(purchase.items)) {
      for (const item of purchase.items as any[]) {
        if (item.productId && item.quantity) {
          await this.updateProductStock(item.productId, item.quantity);
        }
      }
    }
    
    return purchase;
  }
  
  async updatePurchase(id: number, purchaseUpdate: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const [purchase] = await db.update(purchases)
      .set({
        ...purchaseUpdate,
        updatedAt: new Date()
      })
      .where(eq(purchases.id, id))
      .returning();
    return purchase;
  }
  
  async deletePurchase(id: number): Promise<boolean> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!purchase) return false;
    
    // Revert stock changes before deleting purchase
    if (Array.isArray(purchase.items)) {
      for (const item of purchase.items as any[]) {
        if (item.productId && item.quantity) {
          await this.updateProductStock(item.productId, -item.quantity);
        }
      }
    }
    
    const result = await db.delete(purchases).where(eq(purchases.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllPurchases(): Promise<Purchase[]> {
    return db.select().from(purchases).orderBy(desc(purchases.createdAt));
  }
  
  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const now = new Date();
    const [sale] = await db.insert(sales).values({
      ...insertSale,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    // Reduce product stocks based on sale
    if (Array.isArray(sale.items)) {
      for (const item of sale.items as any[]) {
        if (item.productId && item.quantity) {
          await this.updateProductStock(item.productId, -item.quantity);
        }
      }
    }
    
    return sale;
  }
  
  async updateSale(id: number, saleUpdate: Partial<InsertSale>): Promise<Sale | undefined> {
    const [sale] = await db.update(sales)
      .set({
        ...saleUpdate,
        updatedAt: new Date()
      })
      .where(eq(sales.id, id))
      .returning();
    return sale;
  }
  
  async deleteSale(id: number): Promise<boolean> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return false;
    
    // Revert stock changes before deleting sale
    if (Array.isArray(sale.items)) {
      for (const item of sale.items as any[]) {
        if (item.productId && item.quantity) {
          await this.updateProductStock(item.productId, item.quantity);
        }
      }
    }
    
    const result = await db.delete(sales).where(eq(sales.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllSales(): Promise<Sale[]> {
    return db.select().from(sales).orderBy(desc(sales.createdAt));
  }
  
  async getSalesBySalesperson(salespersonId: number): Promise<Sale[]> {
    return db.select()
      .from(sales)
      .where(eq(sales.salespersonId, salespersonId))
      .orderBy(desc(sales.createdAt));
  }
  
  // Invoice Template operations
  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.id, id));
    return template;
  }
  
  async createInvoiceTemplate(insertTemplate: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const now = new Date();
    const isDefault = !!insertTemplate.isDefault;
    
    // If this is set as default, unset any existing defaults
    if (isDefault) {
      await db.update(invoiceTemplates)
        .set({ isDefault: false })
        .where(eq(invoiceTemplates.isDefault, true));
    }
    
    const [template] = await db.insert(invoiceTemplates).values({
      ...insertTemplate,
      isDefault,
      createdAt: now,
      updatedAt: now
    }).returning();
    return template;
  }
  
  async updateInvoiceTemplate(id: number, templateUpdate: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    const isDefault = !!templateUpdate.isDefault;
    
    // If this is set as default, unset any existing defaults
    if (isDefault) {
      await db.update(invoiceTemplates)
        .set({ isDefault: false })
        .where(eq(invoiceTemplates.isDefault, true));
    }
    
    const [template] = await db.update(invoiceTemplates)
      .set({
        ...templateUpdate,
        updatedAt: new Date()
      })
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return template;
  }
  
  async getDefaultInvoiceTemplate(): Promise<InvoiceTemplate | undefined> {
    const [template] = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.isDefault, true));
    return template;
  }
  
  async getAllInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return db.select().from(invoiceTemplates);
  }
  
  // Approval Request operations
  async getApprovalRequest(id: number): Promise<ApprovalRequest | undefined> {
    const [request] = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    return request;
  }
  
  async createApprovalRequest(insertRequest: InsertApprovalRequest): Promise<ApprovalRequest> {
    const now = new Date();
    const [request] = await db.insert(approvalRequests).values({
      ...insertRequest,
      status: "pending",
      createdAt: now,
      updatedAt: now
    }).returning();
    return request;
  }
  
  async updateApprovalRequest(id: number, requestUpdate: Partial<ApprovalRequest>): Promise<ApprovalRequest | undefined> {
    const [request] = await db.update(approvalRequests)
      .set({
        ...requestUpdate,
        updatedAt: new Date()
      })
      .where(eq(approvalRequests.id, id))
      .returning();
    
    // Handle the approval/rejection process
    if (request && (requestUpdate.status === "approved" || requestUpdate.status === "rejected")) {
      const { entityType, entityId } = request;
      
      if (requestUpdate.status === "approved") {
        // Approve the entity based on type
        switch (entityType) {
          case "vendor":
            await db.update(vendors)
              .set({ isApproved: true, updatedAt: new Date() })
              .where(eq(vendors.id, entityId));
            break;
          case "distributor":
            await db.update(distributors)
              .set({ isApproved: true, updatedAt: new Date() })
              .where(eq(distributors.id, entityId));
            break;
          case "retailer":
            await db.update(retailers)
              .set({ isApproved: true, updatedAt: new Date() })
              .where(eq(retailers.id, entityId));
            break;
          case "billedEntity":
            await db.update(billedEntities)
              .set({ isApproved: true, updatedAt: new Date() })
              .where(eq(billedEntities.id, entityId));
            break;
        }
      }
    }
    
    return request;
  }
  
  async getAllApprovalRequests(): Promise<ApprovalRequest[]> {
    return db.select().from(approvalRequests).orderBy(desc(approvalRequests.createdAt));
  }
  
  async getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
    return db.select()
      .from(approvalRequests)
      .where(eq(approvalRequests.status, "pending"))
      .orderBy(desc(approvalRequests.createdAt));
  }
}

// Export the DatabaseStorage as the storage implementation
export const storage = new DatabaseStorage();