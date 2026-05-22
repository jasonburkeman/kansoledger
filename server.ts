import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

dotenv.config();

// Plaid Client Getter (Lazy initialization)
let currentPlaidConfig = { clientId: "", secret: "", env: "" };
let plaidClient: PlaidApi | null = null;

function getPlaidClient() {
  const clientId = (process.env.PLAID_CLIENT_ID || "").trim();
  const secret = (process.env.PLAID_SECRET || "").trim();
  let env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();

  if (env === 'dev' || env === 'development') env = 'development';
  else if (env === 'prod' || env === 'production') env = 'production';
  else env = 'sandbox';

  // Re-initialize if keys or environment changed
  if (
    !plaidClient ||
    currentPlaidConfig.clientId !== clientId ||
    currentPlaidConfig.secret !== secret ||
    currentPlaidConfig.env !== env
  ) {
    if (!clientId || !secret) {
      throw new Error("Plaid API keys are missing. Please add PLAID_CLIENT_ID and PLAID_SECRET to Secrets.");
    }

    const basePath = PlaidEnvironments[env] || PlaidEnvironments.sandbox;
    const config = new Configuration({
      basePath,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    plaidClient = new PlaidApi(config);
    currentPlaidConfig = { clientId, secret, env };
  }
  return plaidClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API client
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const apiRouter = express.Router();

  // API Check: Plaid Status
  apiRouter.get("/plaid/status", (req, res) => {
    const clientId = (process.env.PLAID_CLIENT_ID || "").trim();
    const secret = (process.env.PLAID_SECRET || "").trim();
    let env = (process.env.PLAID_ENV || 'sandbox').trim().toLowerCase();
    
    if (env === 'dev' || env === 'development') env = 'development';
    else if (env === 'prod' || env === 'production') env = 'production';
    else env = 'sandbox';
    
    const debugInfo = { 
      configured: !!(clientId && secret),
      hasClientId: !!clientId,
      hasSecret: !!secret,
      env: env,
      debug: {
        clientIdHint: clientId ? `${clientId.slice(0, 4)}...${clientId.slice(-4)}` : null,
        secretLength: secret.length,
        secretHint: secret ? `${secret.slice(0, 2)}...` : null,
        envInternal: env,
        detectedKeys: Object.keys(process.env).filter(k => k.startsWith('PLAID_') || k.includes('GEMINI'))
      }
    };
    
    // Safety check: if secret length is 24, it's likely the Client ID was pasted twice
    if (secret.length === 24 && String(clientId).length === 24) {
      (debugInfo as any).warning = "Secret length (24) matches Client ID length. You might have pasted the Client ID into the Secret field by mistake. Secrets are usually longer.";
    }
    
    if (env !== 'sandbox' && secret.length < 30) {
      (debugInfo as any).warning = `Potential mismatch: Plaid ${env} secrets are normally 30 characters. Yours is ${secret.length}.`;
    }

    res.json(debugInfo);
  });

  // Create Plaid Link Token
  apiRouter.post("/plaid/create_link_token", async (req, res) => {
    try {
      const client = getPlaidClient();
      
      let env = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
      if (env === 'dev' || env === 'development') env = 'development';
      else if (env === 'prod' || env === 'production') env = 'production';
      else env = 'sandbox';
      
      // Use APP_URL if available, otherwise Plaid won't work for OAuth banks in production
      const redirect_uri = process.env.APP_URL;

      const response = await client.linkTokenCreate({
        user: { client_user_id: 'user-id' },
        client_name: 'Kanso Ledger',
        products: ['transactions' as any],
        country_codes: ['US' as any],
        language: 'en',
        ...(env === 'production' && redirect_uri ? { redirect_uri } : {}),
      });
      res.json(response.data);
    } catch (error: any) {
      const plaidError = error.response?.data;
      console.error("Plaid Error:", plaidError || error.message);
      res.status(500).json({ 
        error: error.message || "Failed to create link token",
        plaid_error: plaidError,
        using_redirect_uri: process.env.APP_URL 
      });
    }
  });

  // Exchange Public Token for Access Token
  apiRouter.post("/plaid/exchange_public_token", async (req, res) => {
    try {
      const client = getPlaidClient();
      const { public_token } = req.body;
      const response = await client.itemPublicTokenExchange({
        public_token,
      });
      res.json({ access_token: response.data.access_token });
    } catch (error: any) {
      console.error("Plaid Exchange Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to exchange token" });
    }
  });

  // Get Transactions
  apiRouter.post("/plaid/transactions", async (req, res) => {
    try {
      const client = getPlaidClient();
      const { access_token } = req.body;
      const response = await client.transactionsSync({
        access_token,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Plaid Transactions Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // API endpoint for financial insights
  apiRouter.post("/insights", async (req, res) => {
    try {
      const { budgetData, query } = req.body;

      const prompt = `
        You are a expert financial advisor. Analyze the following budget data and answer the user's query.
        Data: ${JSON.stringify(budgetData)}
        Query: ${query || "Provide a summary of my spending and suggestions for improvement."}
        
        Keep your response concise, actionable, and encouraging. Use markdown formatting.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      res.json({ insight: result.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // Mount router under both prefixes to handle dev and Netlify routing seamlessly
  app.use("/api", apiRouter);
  app.use("/.netlify/functions/api", apiRouter);

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
