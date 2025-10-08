import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertOrderSchema } from "../shared/schema.js";
import { z } from "zod";

// Schema for crypto transaction verification
const verifyTransactionSchema = z.object({
  txHash: z.string().min(1, "Transaction hash is required"),
  crypto: z.enum(["bitcoin", "ethereum", "usdt"]),
  amount: z.string().or(z.number()).transform(Number),
  address: z.string().min(1, "Recipient address is required")
});

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

// Import webhook handlers for transaction confirmation
import { handleTransactionWebhook, monitorTransaction } from './webhooks';
import { getFlutterwaveService } from './payments/flutterwave';
import { cryptoPaymentService } from './payments/crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate session ID if not exists
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {} as any;
    }
    if (!req.session.id) {
      req.session.id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    next();
  });

  // Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get game by slug
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

  // Get cryptocurrency exchange rates
  app.get("/api/crypto-rates", async (req, res) => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether,avalanche-2&vs_currencies=usd');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch cryptocurrency rates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get cart items
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // Add item to cart
  app.post("/api/cart", async (req, res) => {
    console.log('Attempting to add to cart...');
    console.log('Session ID:', req.session.id);
    console.log('Request Body:', req.body);
    try {
      const sessionId = req.session.id!;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        sessionId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Update cart item quantity
  app.put("/api/cart/:gameId", async (req, res) => {
    try {
      const sessionId = req.session.id!;
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

  // Remove item from cart
  app.delete("/api/cart/:gameId", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const gameId = parseInt(req.params.gameId);
      
      await storage.removeFromCart(sessionId, gameId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Create order (checkout)
  app.post("/api/orders", async (req, res) => {
    try {
      const sessionId = req.session.id!;
      const orderData = insertOrderSchema.parse({
        ...req.body,
        sessionId,
      });

      const order = await storage.createOrder(orderData);
      
      // Clear cart after successful order
      await storage.clearCart(sessionId);
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Verify crypto transaction
  app.post("/api/verify-transaction", async (req, res) => {
    try {
      const { txHash, crypto, amount, address } = verifyTransactionSchema.parse(req.body);
      
      // In a real application, you would:
      // 1. Verify the transaction exists on the blockchain
      // 2. Check it's confirmed (required number of confirmations)
      // 3. Verify the amount and recipient address match
      // 4. Check for double-spending
      
      // For demo purposes, we'll simulate a successful verification
      // In production, you would use a blockchain API like BlockCypher, Blockstream, or Infura
      
      // Simulate blockchain verification
      const isVerified = Math.random() > 0.3; // 70% chance of success for demo
      
      if (isVerified) {
        // In a real app, you would create an order record here
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
      if (error instanceof z.ZodError) {
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

  // Flutterwave payment routes
  app.post('/api/payments/flutterwave/create', async (req, res) => {
    try {
      console.log('Flutterwave payment request received:', req.body);
      
      const flutterwaveService = getFlutterwaveService();
      if (!flutterwaveService) {
        return res.status(503).json({
          success: false,
          message: 'Flutterwave service not configured. Please add FLUTTERWAVE_SECRET_KEY to environment variables.',
        });
      }
      
      const { 
        amount, 
        currency = 'NGN', 
        customer_email, 
        customer_name, 
        customer_phone, 
        title, 
        description, 
        redirect_url 
      } = req.body;
      
      console.log('Extracted data:', { amount, currency, customer_email, customer_name, customer_phone });
      
      const sessionId = req.session.id!;
      const tx_ref = `rubikcon_${sessionId}_${Date.now()}`;
      
      const paymentResponse = await flutterwaveService.createPaymentLink({
        amount,
        currency,
        email: customer_email,
        name: customer_name,
        phone_number: customer_phone,
        tx_ref,
        redirect_url: redirect_url || `${process.env.FRONTEND_URL}/payment-success`,
        payment_options: 'card,mobilemoney,banktransfer,ussd',
      });
      
      console.log('Sending to Flutterwave:', {
        amount,
        currency,
        email: customer_email,
        name: customer_name,
        phone_number: customer_phone,
        tx_ref
      });
      
      // Store payment reference in session or database
      req.session.pending_payment = {
        tx_ref,
        amount,
        currency,
        customer_email,
        payment_method: 'flutterwave',
      };
      
      res.json({
        success: true,
        payment_link: paymentResponse.data.link,
        tx_ref,
      });
    } catch (error) {
      console.error('Flutterwave payment creation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Payment creation failed',
      });
    }
  });

  // Flutterwave webhook
  app.post('/api/webhook/flutterwave', async (req, res) => {
    try {
      const flutterwaveService = getFlutterwaveService();
      if (!flutterwaveService) {
        return res.status(503).send('Service not configured');
      }
      
      const signature = req.headers['verif-hash'] as string;
      const isValid = await flutterwaveService.handleWebhook(req.body, signature);
      
      if (isValid) {
        // Process successful payment - create order, clear cart, etc.
        console.log('Flutterwave payment confirmed:', req.body);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Flutterwave webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Crypto payment routes
  app.post('/api/payments/crypto/create', async (req, res) => {
    try {
      const { provider = 'swypt' } = req.body;
      const sessionId = req.session.id!;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (!cartItems.length) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }
      
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.game.price * item.quantity), 0) / 100;
      const orderId = `crypto_${sessionId}_${Date.now()}`;
      
      let paymentResponse;
      
      // Use Coinbase Commerce as the primary crypto payment provider
      paymentResponse = await cryptoPaymentService.createCoinbasePayment({
        amount: totalAmount,
        currency: 'USD',
        order_id: orderId,
        customer_email: req.body.email || 'customer@rubikcongames.xyz',
        redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
        webhook_url: `${process.env.BACKEND_URL}/api/webhook/coinbase`,
      });
      
      req.session.pending_payment = {
        order_id: orderId,
        amount: totalAmount,
        currency: 'USD',
        cart_items: cartItems,
        payment_method: 'coinbase_commerce',
      };
      
      res.json({
        success: true,
        payment_url: paymentResponse.data.payment_url,
        payment_id: paymentResponse.data.payment_id,
        qr_code: paymentResponse.data.qr_code,
      });
    } catch (error) {
      console.error('Crypto payment creation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Crypto payment creation failed',
      });
    }
  });

  // Coinbase Commerce webhook
  app.post('/api/webhook/coinbase', async (req, res) => {
    try {
      const signature = req.headers['x-cc-webhook-signature'] as string;
      // Verify Coinbase webhook signature here
      
      if (req.body.event.type === 'charge:confirmed') {
        console.log('Coinbase payment confirmed:', req.body);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Coinbase webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Payment success page data
  app.get('/api/payment-status/:reference', async (req, res) => {
    try {
      const { reference } = req.params;
      const sessionId = req.session.id!;
      
      // Check payment status from provider
      // This would typically query your database for the payment status
      
      res.json({
        success: true,
        status: 'completed', // or 'pending', 'failed'
        reference,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status',
      });
    }
  });

  // Register original routes for transaction monitoring and webhook handling
  app.post('/api/monitor-transaction', monitorTransaction);
  app.post('/api/webhook/transaction-confirmed', handleTransactionWebhook);

  const httpServer = createServer(app);
  return httpServer;
}
