// server/index.ts
import dotenv from "dotenv";
import express2 from "express";
import session from "express-session";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  games;
  cartItems;
  orders;
  currentGameId;
  currentCartItemId;
  currentOrderId;
  constructor() {
    this.games = /* @__PURE__ */ new Map();
    this.cartItems = /* @__PURE__ */ new Map();
    this.orders = /* @__PURE__ */ new Map();
    this.currentGameId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.initializeGames();
  }
  initializeGames() {
    const sampleGames = [
      {
        title: "Web3 Trivia",
        slug: "web3-trivia",
        description: "Prove you're Web3 alpha! Test your crypto IQ with this trivia game, perfect for hangouts or savage showdowns. From Bitcoin to DeFi, can you outsmart the degens? Let's play now - Winner takes bragging rights (and maybe a moonbag).",
        price: 1200,
        // $12 in cents
        category: "card",
        image: "/images/card1.png",
        images: [
          "/images/card1.png"
        ],
        isOnline: 0
      },
      {
        title: "Crypto Charades",
        slug: "crypto-charades",
        description: "How well do you REALLY know crypto lingo? Act out Bitcoin, DeFi, NFTs and more in this hilarious party game that'll have everyone guessing and laughing!",
        price: 1200,
        // $12 in cents
        category: "card",
        image: "/images/card2.png",
        images: [
          "/images/card2.png"
        ],
        isOnline: 0
      },
      {
        title: "Blocks and Hashes",
        slug: "blocks-and-hashes",
        description: "Master the fundamentals of blockchain technology with this strategic card game that teaches you about cryptographic hashing, mining, and consensus mechanisms.",
        price: 1200,
        // $12 in cents
        category: "card",
        image: "/images/card3.png",
        images: [
          "/images/card3.png"
        ],
        isOnline: 0
      },
      {
        title: "Into the Cryptoverse",
        slug: "into-the-cryptoverse",
        description: "Journey through the multiverse of cryptocurrency in this immersive card game experience that spans Bitcoin, Ethereum, and beyond.",
        price: 1200,
        // $12 in cents
        category: "card",
        image: " /images/card4.png",
        images: [
          "/images/card4.png"
        ],
        isOnline: 0
      },
      {
        title: "Web3 Trivia Online",
        slug: "web3-trivia-online",
        description: "Play the ultimate Web3 trivia game online with friends from around the world. Test your knowledge and climb the leaderboards!",
        price: 1200,
        // $12 in cents
        category: "online",
        image: "/images/card5.png",
        images: [
          "/images/card5.png"
        ],
        isOnline: 1
      }
    ];
    sampleGames.forEach((game) => {
      this.createGame(game);
    });
  }
  async getGames() {
    return Array.from(this.games.values());
  }
  async getGameBySlug(slug) {
    return Array.from(this.games.values()).find((game) => game.slug === slug);
  }
  async getGameById(id) {
    return this.games.get(id);
  }
  async createGame(insertGame) {
    const id = this.currentGameId++;
    const game = {
      ...insertGame,
      id,
      images: insertGame.images || [],
      isOnline: insertGame.isOnline || 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.games.set(id, game);
    return game;
  }
  async getCartItems(sessionId) {
    const items = this.cartItems.get(sessionId) || [];
    const result = [];
    for (const item of items) {
      const game = this.games.get(item.gameId);
      if (game) {
        result.push({ ...item, game });
      }
    }
    return result;
  }
  async addToCart(insertItem) {
    const sessionItems = this.cartItems.get(insertItem.sessionId) || [];
    const existingItem = sessionItems.find((item) => item.gameId === insertItem.gameId);
    if (existingItem) {
      existingItem.quantity += insertItem.quantity || 1;
      return existingItem;
    } else {
      const newItem = {
        ...insertItem,
        id: this.currentCartItemId++,
        quantity: insertItem.quantity || 1,
        createdAt: /* @__PURE__ */ new Date()
      };
      sessionItems.push(newItem);
      this.cartItems.set(insertItem.sessionId, sessionItems);
      return newItem;
    }
  }
  async updateCartItemQuantity(sessionId, gameId, quantity) {
    const sessionItems = this.cartItems.get(sessionId) || [];
    const item = sessionItems.find((item2) => item2.gameId === gameId);
    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(sessionId, gameId);
      } else {
        item.quantity = quantity;
      }
    }
  }
  async removeFromCart(sessionId, gameId) {
    const sessionItems = this.cartItems.get(sessionId) || [];
    const filteredItems = sessionItems.filter((item) => item.gameId !== gameId);
    this.cartItems.set(sessionId, filteredItems);
  }
  async clearCart(sessionId) {
    this.cartItems.delete(sessionId);
  }
  async createOrder(insertOrder) {
    const id = this.currentOrderId++;
    const order = {
      ...insertOrder,
      id,
      items: insertOrder.items,
      status: insertOrder.status || "pending",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.orders.set(id, order);
    return order;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  // Price in kobo (Nigerian currency)
  category: text("category").notNull(),
  // 'card' or 'online'
  image: text("image").notNull(),
  images: jsonb("images").$type().notNull().default([]),
  isOnline: integer("is_online").notNull().default(0),
  // 0 for card games, 1 for online games
  createdAt: timestamp("created_at").defaultNow()
});
var cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  gameId: integer("game_id").notNull().references(() => games.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow()
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  customerInfo: jsonb("customer_info").$type().notNull(),
  items: jsonb("items").$type().notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertGameSchema = createInsertSchema(games, {
  images: z.array(z.string())
}).omit({
  id: true,
  createdAt: true
});
var insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true
});
var orderItemSchema = z.object({
  gameId: z.number(),
  title: z.string(),
  price: z.number(),
  quantity: z.number()
});
var insertOrderSchema = createInsertSchema(orders, {
  items: z.array(orderItemSchema)
}).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { z as z2 } from "zod";
var verifyTransactionSchema = z2.object({
  txHash: z2.string().min(1, "Transaction hash is required"),
  crypto: z2.enum(["bitcoin", "ethereum", "usdt"]),
  amount: z2.string().or(z2.number()).transform(Number),
  address: z2.string().min(1, "Recipient address is required")
});
async function registerRoutes(app) {
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {};
    }
    if (!req.session.id) {
      req.session.id = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }
    next();
  });
  app.get("/api/games", async (req, res) => {
    try {
      const games2 = await storage.getGames();
      res.json(games2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });
  app.get("/api/games/:slug", async (req, res) => {
    try {
      const game = await storage.getGameBySlug(req.params.slug);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });
  app.get("/api/crypto-rates", async (req, res) => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether,avalanche-2&vs_currencies=usd");
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      res.json(data);
    } catch (error) {
      console.error("Error fetching crypto rates:", error);
      res.status(500).json({
        message: "Failed to fetch cryptocurrency rates",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const cartItems2 = await storage.getCartItems(sessionId);
      res.json(cartItems2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });
  app.post("/api/cart", async (req, res) => {
    console.log("Attempting to add to cart...");
    console.log("Session ID:", req.session.id);
    console.log("Request Body:", req.body);
    try {
      const sessionId = req.session.id;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        sessionId
      });
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  app.put("/api/cart/:gameId", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const gameId = parseInt(req.params.gameId);
      const { quantity } = req.body;
      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      await storage.updateCartItemQuantity(sessionId, gameId, quantity);
      res.json({ message: "Cart item updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  app.delete("/api/cart/:gameId", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const gameId = parseInt(req.params.gameId);
      await storage.removeFromCart(sessionId, gameId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });
  app.post("/api/orders", async (req, res) => {
    try {
      const sessionId = req.session.id;
      const orderData = insertOrderSchema.parse({
        ...req.body,
        sessionId
      });
      const order = await storage.createOrder(orderData);
      await storage.clearCart(sessionId);
      res.json(order);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  app.post("/api/verify-transaction", async (req, res) => {
    try {
      const { txHash, crypto, amount, address } = verifyTransactionSchema.parse(req.body);
      const isVerified = Math.random() > 0.3;
      if (isVerified) {
        return res.json({
          verified: true,
          confirmations: 3,
          txHash,
          amount: Number(amount),
          currency: crypto.toUpperCase(),
          address
        });
      } else {
        return res.status(400).json({
          verified: false,
          error: "Transaction verification failed"
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          verified: false,
          error: error.errors[0]?.message || "Invalid request"
        });
      }
      return res.status(500).json({
        verified: false,
        error: "Failed to verify transaction"
      });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path2.resolve(__dirname2, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
async function main() {
  const app = express2();
  app.use(express2.json());
  app.use(express2.urlencoded({ extended: false }));
  app.set("trust proxy", 1);
  const redisClient = createClient({
    url: process.env.REDIS_URL
  });
  redisClient.on("error", (err) => log(`Redis Client Error: ${err}`));
  redisClient.on("connect", () => log("Redis Client Connected"));
  await redisClient.connect();
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: "rubikcon:"
  });
  app.use(
    session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || "rubikcon-games-secret-key",
      resave: false,
      saveUninitialized: true,
      // Ensures session is created for new users
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        // Explicitly set for better browser compatibility
        maxAge: 24 * 60 * 60 * 1e3
        // 24 hours
      }
    })
  );
  app.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path3.startsWith("/api")) {
        let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        log(logLine);
      }
    });
    next();
  });
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}
main().catch((err) => {
  log(`Error starting server: ${err}`);
  process.exit(1);
});
