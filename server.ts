import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin Forgot Password
  app.post("/api/admin/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      // Check if user is admin
      const adminSnap = await db.collection('admins').where('email', '==', email).get();
      if (adminSnap.empty) {
        // Return success anyway to prevent email enumeration, but don't do anything
        return res.json({ message: "If an account exists with that email, a reset link has been sent." });
      }

      const adminDoc = adminSnap.docs[0];
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Save token to Firestore
      await db.collection('reset_tokens').doc(token).set({
        adminId: adminDoc.id,
        email: email,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600000)), // 1 hour
        used: false
      });

      // Construct reset link
      const resetLink = `${req.get('origin') || 'http://localhost:3000'}/?reset_token=${token}`;

      // SIMULATE SENDING EMAIL
      console.log("------------------------------------------");
      console.log(`SECURE ADMIN PASSWORD RESET LINK FOR: ${email}`);
      console.log(`LINK: ${resetLink}`);
      console.log("------------------------------------------");

      res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Admin Reset Password (the actual change)
  app.post("/api/admin/reset-confirm", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });

      const tokenRef = db.collection('reset_tokens').doc(token);
      const tokenSnap = await tokenRef.get();

      if (!tokenSnap.exists) return res.status(400).json({ error: "Invalid or expired token" });
      
      const tokenData = tokenSnap.data()!;
      if (tokenData.used || tokenData.expiresAt.toDate() < new Date()) {
        return res.status(400).json({ error: "Token has expired or already been used" });
      }

      // Update Admin Password
      await db.collection('admins').doc(tokenData.adminId).update({
        secondaryPassword: newPassword,
        passwordLastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Mark token as used
      await tokenRef.delete(); // Or mark as used

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset Confirm Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Simulated Payment Intent for Seat Booking
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, planName } = req.body;
      
      // If Stripe key is present, use it. Otherwise, simulate success.
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // amount in cents
          currency: 'inr',
          metadata: { planName },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } else {
        // Simulated response for UI testing when keys aren't set yet
        console.warn("STRIPE_SECRET_KEY not set. Using simulation mode.");
        res.json({ 
          clientSecret: "simulated_secret_" + Math.random().toString(36).substring(7),
          simulated: true 
        });
      }
    } catch (error) {
      console.error("Payment Intent Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
