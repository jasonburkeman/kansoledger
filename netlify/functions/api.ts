import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI } from "@google/genai";
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Set up Plaid logic
let currentPlaidConfig = { clientId: "", secret: "", env: "" };
let plaidClient: PlaidApi | null = null;

function getPlaidClient() {
  const clientId = (process.env.PLAID_CLIENT_ID || "").trim();
  const secret = (process.env.PLAID_SECRET || "").trim();
  let env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();

  if (env === 'dev' || env === 'development') env = 'development';
  else if (env === 'prod' || env === 'production') env = 'production';
  else env = 'sandbox';

  if (
    !plaidClient ||
    currentPlaidConfig.clientId !== clientId ||
    currentPlaidConfig.secret !== secret ||
    currentPlaidConfig.env !== env
  ) {
    if (!clientId || !secret) {
      throw new Error("Plaid API keys are missing. Please add PLAID_CLIENT_ID and PLAID_SECRET to Environment Variables.");
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
  
  if (secret.length === 24 && String(clientId).length === 24) {
    (debugInfo as any).warning = "Secret length (24) matches Client ID length. Check if Client ID was pasted twice.";
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
      plaid_error: plaidError 
    });
  }
});

// Exchange Public Token
apiRouter.post("/plaid/exchange_public_token", async (req, res) => {
  try {
    const client = getPlaidClient();
    const { public_token } = req.body;
    const response = await client.itemPublicTokenExchange({ public_token });
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
    const response = await client.transactionsSync({ access_token });
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
      You are an expert financial advisor. Analyze the following budget data and answer the user's query.
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

// Mount router under multiple prefixes to handle standard, serverless, and stripped functions routing seamlessly
app.use("/api", apiRouter);
app.use("/.netlify/functions/api", apiRouter);
app.use("/", apiRouter);

// Wrap our Express app routing inside serverless-http
export const handler = serverless(app);
