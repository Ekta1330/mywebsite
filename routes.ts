import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, 
  insertSupplierSchema,
  insertPurchaseSchema,
  insertSaleSchema,
  insertUserSchema,
  insertVendorSchema,
  insertDistributorSchema,
  insertRetailerSchema,
  insertBilledEntitySchema,
  insertInvoiceTemplateSchema,
  insertApprovalRequestSchema
} from "@shared/schema";
import { z } from "zod";

// WebSocket client management
const clients = new Map<string, WebSocket>();

// Data update notifications
interface DataUpdateNotification {
  type: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
}

// Send a WebSocket notification to all connected clients
function notifyClients(notification: DataUpdateNotification): void {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  });
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Admin role middleware
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: "Forbidden: Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  const apiRouter = express.Router();
  
  // Products Routes
  apiRouter.get("/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products", error });
    }
  });
  
  apiRouter.get("/products/low-stock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
      const products = await storage.getLowStockProducts(threshold);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products", error });
    }
  });
  
  apiRouter.get("/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product", error });
    }
  });
  
  apiRouter.post("/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      
      // Notify all connected clients
      notifyClients({
        type: 'product',
        action: 'created',
        data: product
      });
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product", error });
    }
  });
  
  apiRouter.put("/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'product',
        action: 'updated',
        data: product
      });
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product", error });
    }
  });
  
  apiRouter.delete("/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const success = await storage.deleteProduct(id);
      
      if (success) {
        // Notify all connected clients
        notifyClients({
          type: 'product',
          action: 'deleted',
          data: { id }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product", error });
    }
  });
  
  // Suppliers Routes
  apiRouter.get("/suppliers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers", error });
    }
  });
  
  apiRouter.get("/suppliers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier", error });
    }
  });
  
  apiRouter.post("/suppliers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      
      // Create approval request
      if (req.user && req.user.id) {
        await storage.createApprovalRequest({
          entityType: 'supplier',
          entityId: supplier.id,
          requestedBy: req.user.id,
          notes: `New supplier ${supplier.companyName} added by ${req.user.fullName}`
        });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'supplier',
        action: 'created',
        data: supplier
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier", error });
    }
  });
  
  apiRouter.put("/suppliers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'supplier',
        action: 'updated',
        data: supplier
      });
      
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier", error });
    }
  });
  
  apiRouter.delete("/suppliers/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const success = await storage.deleteSupplier(id);
      
      if (success) {
        // Notify all connected clients
        notifyClients({
          type: 'supplier',
          action: 'deleted',
          data: { id }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier", error });
    }
  });
  
  // Vendors Routes
  apiRouter.get("/vendors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors", error });
    }
  });
  
  apiRouter.get("/vendors/approved", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendors = await storage.getApprovedVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved vendors", error });
    }
  });
  
  apiRouter.get("/vendors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor", error });
    }
  });
  
  apiRouter.post("/vendors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      
      // Create approval request
      if (req.user && req.user.id) {
        await storage.createApprovalRequest({
          entityType: 'vendor',
          entityId: vendor.id,
          requestedBy: req.user.id,
          notes: `New vendor ${vendor.name} added by ${req.user.fullName}`
        });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'vendor',
        action: 'created',
        data: vendor
      });
      
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor", error });
    }
  });
  
  apiRouter.put("/vendors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, validatedData);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'vendor',
        action: 'updated',
        data: vendor
      });
      
      res.json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vendor", error });
    }
  });
  
  // Distributor Routes
  apiRouter.get("/distributors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const distributors = await storage.getAllDistributors();
      res.json(distributors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch distributors", error });
    }
  });
  
  apiRouter.get("/distributors/approved", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const distributors = await storage.getApprovedDistributors();
      res.json(distributors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved distributors", error });
    }
  });
  
  apiRouter.get("/distributors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const distributor = await storage.getDistributor(id);
      
      if (!distributor) {
        return res.status(404).json({ message: "Distributor not found" });
      }
      
      res.json(distributor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch distributor", error });
    }
  });
  
  apiRouter.post("/distributors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertDistributorSchema.parse(req.body);
      const distributor = await storage.createDistributor(validatedData);
      
      // Create approval request
      if (req.user && req.user.id) {
        await storage.createApprovalRequest({
          entityType: 'distributor',
          entityId: distributor.id,
          requestedBy: req.user.id,
          notes: `New distributor ${distributor.name} added by ${req.user.fullName}`
        });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'distributor',
        action: 'created',
        data: distributor
      });
      
      res.status(201).json(distributor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid distributor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create distributor", error });
    }
  });
  
  // Retailer Routes
  apiRouter.get("/retailers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const retailers = await storage.getAllRetailers();
      res.json(retailers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch retailers", error });
    }
  });
  
  apiRouter.get("/retailers/approved", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const retailers = await storage.getApprovedRetailers();
      res.json(retailers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved retailers", error });
    }
  });
  
  apiRouter.post("/retailers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertRetailerSchema.parse(req.body);
      const retailer = await storage.createRetailer(validatedData);
      
      // Create approval request
      if (req.user && req.user.id) {
        await storage.createApprovalRequest({
          entityType: 'retailer',
          entityId: retailer.id,
          requestedBy: req.user.id,
          notes: `New retailer ${retailer.storeName} added by ${req.user.fullName}`
        });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'retailer',
        action: 'created',
        data: retailer
      });
      
      res.status(201).json(retailer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid retailer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create retailer", error });
    }
  });
  
  // Billed Entity Routes
  apiRouter.get("/billed-entities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const entities = await storage.getAllBilledEntities();
      res.json(entities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch billed entities", error });
    }
  });
  
  apiRouter.get("/billed-entities/approved", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const entities = await storage.getApprovedBilledEntities();
      res.json(entities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved billed entities", error });
    }
  });
  
  apiRouter.post("/billed-entities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBilledEntitySchema.parse(req.body);
      const entity = await storage.createBilledEntity(validatedData);
      
      // Create approval request
      if (req.user && req.user.id) {
        await storage.createApprovalRequest({
          entityType: 'billedEntity',
          entityId: entity.id,
          requestedBy: req.user.id,
          notes: `New billed entity ${entity.name} added by ${req.user.fullName}`
        });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'billedEntity',
        action: 'created',
        data: entity
      });
      
      res.status(201).json(entity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid billed entity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create billed entity", error });
    }
  });
  
  // Approval Request Routes
  apiRouter.get("/approval-requests", isAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getAllApprovalRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approval requests", error });
    }
  });
  
  apiRouter.get("/approval-requests/pending", isAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingApprovalRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approval requests", error });
    }
  });
  
  apiRouter.put("/approval-requests/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      const request = await storage.updateApprovalRequest(id, { status, notes });
      
      if (!request) {
        return res.status(404).json({ message: "Approval request not found" });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'approvalRequest',
        action: 'updated',
        data: request
      });
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update approval request", error });
    }
  });
  
  // Purchases Routes
  apiRouter.get("/purchases", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases", error });
    }
  });
  
  apiRouter.get("/purchases/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.getPurchase(id);
      
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase", error });
    }
  });
  
  apiRouter.post("/purchases", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(validatedData);
      
      // Notify all connected clients
      notifyClients({
        type: 'purchase',
        action: 'created',
        data: purchase
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase", error });
    }
  });
  
  apiRouter.put("/purchases/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updatePurchase(id, validatedData);
      
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Notify all connected clients
      notifyClients({
        type: 'purchase',
        action: 'updated',
        data: purchase
      });
      
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update purchase", error });
    }
  });
  
  // Sales Routes
  apiRouter.get("/sales", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales", error });
    }
  });
  
  apiRouter.get("/sales/salesperson/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Allow users to only see their own sales unless they are admin
      if (req.user && req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only view your own sales" });
      }
      
      const sales = await storage.getSalesBySalesperson(id);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salesperson sales", error });
    }
  });
  
  apiRouter.get("/sales/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      
      // Allow users to only see their own sales unless they are admin
      if (req.user && sale.salespersonId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only view your own sales" });
      }
      
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale", error });
    }
  });
  
  apiRouter.post("/sales", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Set the salesperson to the current user if not provided
      const saleData = {
        ...req.body,
        salespersonId: req.body.salespersonId || req.user?.id
      };
      
      const validatedData = insertSaleSchema.parse(saleData);
      const sale = await storage.createSale(validatedData);
      
      // Notify all connected clients
      notifyClients({
        type: 'sale',
        action: 'created',
        data: sale
      });
      
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale", error });
    }
  });
  
  apiRouter.put("/sales/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      
      // Allow users to only update their own sales unless they are admin
      if (req.user && sale.salespersonId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only update your own sales" });
      }
      
      const validatedData = insertSaleSchema.partial().parse(req.body);
      const updatedSale = await storage.updateSale(id, validatedData);
      
      // Notify all connected clients
      notifyClients({
        type: 'sale',
        action: 'updated',
        data: updatedSale
      });
      
      res.json(updatedSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sale", error });
    }
  });
  
  // Invoice Template Routes
  apiRouter.get("/invoice-templates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getAllInvoiceTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice templates", error });
    }
  });
  
  apiRouter.get("/invoice-templates/default", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const template = await storage.getDefaultInvoiceTemplate();
      
      if (!template) {
        return res.status(404).json({ message: "No default invoice template found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default invoice template", error });
    }
  });
  
  apiRouter.post("/invoice-templates", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceTemplateSchema.parse(req.body);
      const template = await storage.createInvoiceTemplate(validatedData);
      
      // Notify all connected clients
      notifyClients({
        type: 'invoiceTemplate',
        action: 'created',
        data: template
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice template", error });
    }
  });
  
  // Users Routes
  apiRouter.get("/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error });
    }
  });
  
  // Dashboard data
  apiRouter.get("/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      const lowStockProducts = await storage.getLowStockProducts();
      const users = await storage.getAllUsers();
      const sales = await storage.getAllSales();
      const purchases = await storage.getAllPurchases();
      
      // Calculate totals
      const totalSales = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
      const totalPurchases = purchases.reduce((acc, purchase) => acc + purchase.totalAmount, 0);
      
      res.json({
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.length,
        totalUsers: users.length,
        salesOverview: {
          total: totalSales,
          count: sales.length
        },
        purchaseOverview: {
          total: totalPurchases,
          count: purchases.length
        },
        inventorySummary: {
          total: products.length,
          lowStock: lowStockProducts.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data", error });
    }
  });
  
  // Mount the API router
  app.use("/api", apiRouter);
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  wss.on('connection', (ws, request) => {
    const clientId = request.headers['sec-websocket-key'] || Date.now().toString();
    clients.set(clientId, ws);
    
    // Send initial connection success
    ws.send(JSON.stringify({ type: 'connection', status: 'connected', clientId }));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle specific message types if needed
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
    });
  });
  
  return httpServer;
}
