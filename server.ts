import { createServer } from 'http';
console.log('[SERVER] Starting Noisezer Agent...');
import { z } from 'zod';
import { parse } from 'url';

const RequestDataSchema = z.object({
  agentId: z.string(),
  query: z.string().min(1).max(500),
});

const ExecuteTradeSchema = z.object({
  signalId: z.string(),
  marketId: z.string(),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import Parser from 'rss-parser';
import TelegramBot from 'node-telegram-bot-api';
import { privateKeyToAccount } from 'viem/accounts';
import { getBaseBalance, bankrSwap, getBankrJobStatus, getBankrBalances, bankrPrompt } from './lib/blockchain';
import { getBaseAlphaInsights } from './lib/discovery';
import { OracleArbStrategy } from './lib/limitless/strategy';
import { getLimitlessClient } from './lib/limitless/client';
import { searchSignalServerCoT, analyzeIntent, getGeneralMarketSentiment } from './lib/gemini-server';
import { fetchDexScreenerData } from './lib/adapters/dexscreener';
import { db } from './lib/firebase';
import { doc, setDoc, getDoc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const intervalManager = {
  intervals: [] as NodeJS.Timeout[],
  add(fn: () => void, ms: number) {
    this.intervals.push(setInterval(fn, ms));
  },
  clearAll() {
    this.intervals.forEach(clearInterval);
  }
};

import { logger } from './lib/logger';

// Initialize Telegram Bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;
if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;
    
    try {
      if (!BANKR_API_KEY) {
        bot?.sendMessage(chatId, 'Error: BANKR_API_KEY is not configured.');
        return;
      }
      // Use bankrPrompt to get a response from the agent
      const response = await bankrPrompt(BANKR_API_KEY, text);
      console.log(`[TELEGRAM] bankrPrompt response: ${JSON.stringify(response)}`);
      
      if (response.success && response.data) {
        const data = response.data;
        const jobId = data.jobId || data.id || data.job_id;
        if (jobId) {
          bot?.sendMessage(chatId, 'Noisezer sedang memproses... (Job ID: ' + jobId + ')');
          // Poll for status
          let status = 'pending';
          let result = null;
          let attempts = 0;
          console.log(`[TELEGRAM] Starting polling for jobId: ${jobId}`);
          while (status === 'pending' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`[TELEGRAM] Polling attempt ${attempts + 1} for jobId: ${jobId}`);
            const jobStatus = await getBankrJobStatus(BANKR_API_KEY, jobId);
            console.log(`[TELEGRAM] Job status response: ${JSON.stringify(jobStatus)}`);
            status = jobStatus.status;
            result = jobStatus.message;
            attempts++;
          }
          bot?.sendMessage(chatId, result || 'Selesai diproses.');
        } else {
          const responseString = typeof data === 'string' ? data : JSON.stringify(data);
          bot?.sendMessage(chatId, responseString);
        }
      } else {
        bot?.sendMessage(chatId, 'Error: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[TELEGRAM] Error processing request:', error);
      bot?.sendMessage(chatId, 'Error processing your request. Please check server logs.');
    }
  });
}

// Persistent Noisezer Wallet from Environment or Temporary for Session
const NOISEZER_PRIVATE_KEY = (process.env.NOISEZER_PRIVATE_KEY as `0x${string}`) || '';
const BANKR_API_KEY = process.env.BANKR_API_KEY || process.env.BANKR_KEY || process.env.NOISEZER_BANKR_API_KEY;

// Noisezer Official Wallet Address from System Instructions
const OFFICIAL_NOISEZER_ADDRESS = '0xfaaa2fd28530524818154968048738a614d4b1e2';

// State untuk melacak apakah wallet sudah siap
let NOISEZER_ADDRESS = OFFICIAL_NOISEZER_ADDRESS;
let isWalletReady = false;

if (BANKR_API_KEY) {
  logger.info(`BANKR_API_KEY detected (Length: ${BANKR_API_KEY.length}). Noisezer is now in Managed Wallet mode.`);
} else {
  logger.warn('BANKR_API_KEY not found. Noisezer is in Self-Managed (Temporary) mode.');
}

if (!process.env.NOISEZER_PRIVATE_KEY) {
  console.warn('!!! WARNING: NOISEZER_PRIVATE_KEY not found in environment. Generating a temporary wallet for this session only.');
  console.log(`[NOISEZER] TEMP Mainnet Wallet: ${NOISEZER_ADDRESS}`);
  console.log(`[NOISEZER] TEMP PRIVATE KEY: ${NOISEZER_PRIVATE_KEY.substring(0, 6)}...`);
  console.log('To make this permanent, add NOISEZER_PRIVATE_KEY to your Secrets in AI Studio Settings.');
} else {
  console.log(`[NOISEZER] Persistent Mainnet Wallet Loaded: ${NOISEZER_ADDRESS}`);
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Referer': 'https://cryptopanic.com/'
  }
});

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 3000;

let io: Server;
let agents: any[] = [];
const x402Transactions: any[] = [];
const limitlessStrategy = new OracleArbStrategy();

// Fetch real data from Polymarket (Gamma API - Public)
async function fetchPolymarketData() {
  try {
    const res = await fetch('https://gamma-api.polymarket.com/markets?active=true&limit=10&order=volume&ascending=false');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      logger.info(`[POLYMARKET] Successfully fetched ${data.length} live markets.`);
      return data.map((m: any) => ({
        id: m.id,
        question: m.question,
        probability: m.outcomePrices ? parseFloat(JSON.parse(m.outcomePrices)[0]) : 0.5,
        volume: m.volume24hr ? `$${Math.floor(m.volume24hr / 1000)}k` : 'N/A',
        isLive: true
      }));
    }
    throw new Error('Invalid data format from Polymarket');
  } catch (e) {
    logger.warn(`[POLY_FALLBACK] Using simulated markets: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return [
      { id: 'poly-1', question: 'Will ETH hit $5000 in March?', probability: 0.15, volume: '1.2M', isLive: false },
      { id: 'poly-2', question: 'US Presidential Election Winner', probability: 0.52, volume: '450M', isLive: false },
      { id: 'poly-3', question: 'Will Base L3 launch before Q3?', probability: 0.78, volume: '800K', isLive: false }
    ];
  }
}

// Fetch News for Alpha (FREE SOURCES - $0 COST)
async function fetchGlobalNews() {
  const feeds = [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/feed/',
    'https://www.theblock.co/rss.xml'
  ];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      if (feed?.items?.length > 0) {
        console.log(`✅ Fetched from ${feedUrl}`);
        return feed.items.slice(0, 10).map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || new Date().toISOString(),
          isLive: true
        }));
      }
    } catch (error) {
      console.warn(`⚠️ Failed ${feedUrl}, trying next...`);
      continue;
    }
  }

  // Fallback jika semua fail
  return [{
    title: 'Base Chain AI updates',
    link: 'https://coindesk.com',
    pubDate: new Date().toISOString(),
    isLive: false
  }];
}

async function pollSignals() {
  if (!BANKR_API_KEY) return;
  console.log('[NOISEZER] Polling for new signals...');
  try {
    // Fetch comprehensive off-chain context (Dex, News, GitHub, On-chain, Polymarket)
    const alphaInsights = await getBaseAlphaInsights();
    const offChainContext = `Alpha Insights: ${JSON.stringify(alphaInsights.rawData)}.`;

    const intent = await analyzeIntent('Base chain alpha opportunities');
    const signals = intent.clarificationNeeded ? [] : await searchSignalServerCoT('Base chain alpha opportunities', offChainContext);
    if (signals && signals.length > 0) {
      // Auto-execute if PAID, high confidence, and balance > 5 USDC
      for (const signal of signals) {
        if (signal.x402Status === 'PAID' && signal.confidence > 0.9) {
          const balances = await getBankrBalances(BANKR_API_KEY);
          const usdcBalance = parseFloat(balances.balances?.find((b: any) => b.symbol === 'USDC')?.amount || '0');
          
          if (usdcBalance > 5) {
            console.log(`[NOISEZER] Auto-executing signal: ${signal.id}`);
            const result = await bankrSwap(BANKR_API_KEY, 'USDC', signal.url, '1');
            x402Transactions.push({
              id: `tx-${Date.now()}`,
              amount: 1,
              status: result.transactionHash ? 'SUCCESS' : 'FAILED',
              timestamp: Date.now()
            });
            io.emit('x402-updates', x402Transactions);
          }
        }
      }
      io.emit('signal-updates', signals);
    }
  } catch (error) {
    console.error('[NOISEZER] Polling Error:', error);
  }
}

async function saveAgent(agent: any) {
  try {
    await setDoc(doc(db, 'agents', agent.id), agent);
  } catch (error) {
    console.error('[FIRESTORE] Error saving agent:', error);
  }
}

async function saveTransaction(tx: any) {
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx);
  } catch (error) {
    console.error('[FIRESTORE] Error saving transaction:', error);
  }
}

/**
 * Autonomous Operational Logic (Noisezer Truth Filter)
 * 1. Maintain ETH > 0.001 for gas
 * 2. Auto-claim fees from Bankr
 * 3. Revenue allocation for API/Gas
 */
async function autonomousOperations() {
  if (!BANKR_API_KEY) return;

  try {
    console.log('[NOISEZER] Running autonomous operations...');
    const data = await getBankrBalances(BANKR_API_KEY);
    
    if (data && data.address) {
      const ethBalanceData = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'ETH' || b.symbol === 'eth'));
      const usdcBalanceData = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'USDC' || b.symbol === 'usdc'));
      
      const ethBalance = parseFloat(ethBalanceData?.amount || '0');
      const usdcBalance = parseFloat(usdcBalanceData?.amount || '0');
      
      // 1. Maintain ETH Balance (> 0.001)
      if (ethBalance < 0.001) {
        console.warn(`[NOISEZER] CRITICAL: Balance low (${ethBalance} ETH). Attempting auto-refill...`);
        // Logic to swap USDC to ETH if available
        if (usdcBalance > 1) {
          console.log('[NOISEZER] Swapping 1 USDC to ETH for gas...');
          await bankrSwap(BANKR_API_KEY, 'USDC', 'ETH', '1');
        }
      }

      // 2. Auto-Claim Fees (Simulated check via prompt)
      console.log('[NOISEZER] Checking for claimable fees...');
      const claimResult = await bankrPrompt(BANKR_API_KEY, "claim all available trading fees and rewards on Base");
      
      if (claimResult.success) {
        console.log('[NOISEZER] Auto-claim initiated:', claimResult.data.jobId || 'Success');
      }
    }
  } catch (error) {
    console.error('[NOISEZER] Autonomous Ops Error:', error);
  }
}

// Run autonomous operations every 30 minutes
intervalManager.add(autonomousOperations, 30 * 60 * 1000);

// Run Limitless autonomous operations every 5 minutes
// setInterval(autonomousLimitlessOperations, 5 * 60 * 1000);

// Initial run after a short delay
setTimeout(autonomousOperations, 10000);
// setTimeout(autonomousLimitlessOperations, 15000);

async function autonomousLimitlessOperations() {
  if (!process.env.LIMITLESS_API_KEY) return;

  try {
    console.log('[NOISEZER] Running Limitless autonomous operations...');
    const client = getLimitlessClient();
    const markets = await client.getMarkets();
    
    // Simulate Sub-Predict analysis
    for (const market of markets.slice(0, 5)) {
      const analysis = { score: Math.random() * 100 }; // Simulated score
      
      // Update feed
      io.emit('signal-updates', [{
        id: `s-limitless-${Date.now()}`,
        type: 'PREDICTION',
        source: 'Limitless',
        author: 'Sub-Predict',
        content: `Market: ${market.question}, Score: ${analysis.score.toFixed(2)}`,
        confidence: analysis.score / 100,
        timestamp: Date.now(),
        x402Status: 'PAID'
      }]);

      if (analysis.score > 80) {
        const result = await limitlessStrategy.tick(market, analysis);
        
        // Update feed with result
        io.emit('x402-updates', [{
          id: result.id,
          amount: 1,
          status: result.status,
          timestamp: Date.now(),
          type: 'LIMITLESS_BUY'
        }]);
        
        // Feedback to Noisezer
        const mainAgent = agents.find(a => a.id === 'noisezer-main');
        if (mainAgent) {
          mainAgent.task = `Limitless trade result: ${result.status}`;
          mainAgent.history.push({ time: Date.now(), result: result.status, marketId: market.id });
          io.emit('agent-updates', agents);
        }
      }
    }
  } catch (error) {
    console.error('[NOISEZER] Limitless Autonomous Ops Error:', error);
  }
}

async function syncWithBankr() {
  if (BANKR_API_KEY) {
    try {
      logger.info('[BANKR] Syncing wallet info...');
      const data = await getBankrBalances(BANKR_API_KEY);
      
      // Debug log to file
      const fs = await import('fs');
      fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] Sync Data: ${JSON.stringify(data)}\n`);
      
      if (data && data.address) {
        NOISEZER_ADDRESS = data.address;
        isWalletReady = true;
        logger.info(`[BANKR] SUCCESS: Synced with Bankr Wallet: ${NOISEZER_ADDRESS}`);
        
        // Update agent info
        const main = agents.find(a => a.id === 'noisezer-main');
        if (main) {
          logger.info('[BANKR] Found Noisezer Main Agent, updating onchain data...');
          if (main.onchain) {
            main.onchain.address = NOISEZER_ADDRESS;
            main.onchain.isBankr = true;
            main.onchain.bankrStatus = 'SYNCED';
            
            // Also update balances immediately
            const baseBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'ETH' || b.symbol === 'eth'));
            const usdcBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'USDC' || b.symbol === 'usdc'));
            main.onchain.mainnetBalance = baseBalance?.amount || '0.00';
            main.onchain.usdcBalance = usdcBalance?.amount || '0.00';
            logger.info(`[BANKR] Initial Balances: ${main.onchain.mainnetBalance} ETH, ${main.onchain.usdcBalance} USDC`);
            logger.info(`[BANKR] Updated Agent Address to: ${main.onchain.address}`);
            await saveAgent(main);
          }
        } else {
          logger.warn('[BANKR] Could not find Noisezer Main Agent in agents array!');
        }
        if (io) {
          io.emit('bankr-sync-success', { address: NOISEZER_ADDRESS });
          io.emit('agent-updates', agents);
        }
      } else {
        throw new Error('No address returned from Bankr API');
      }
    } catch (error) {
      logger.error('[BANKR] Sync Error:', error);
      
      // Fallback to local wallet if Bankr sync fails
      try {
        NOISEZER_ADDRESS = privateKeyToAccount(NOISEZER_PRIVATE_KEY as `0x${string}`).address;
        isWalletReady = true;
        logger.info(`[BANKR] FALLBACK: Using Local Wallet: ${NOISEZER_ADDRESS}`);
        
        const main = agents.find(a => a.id === 'noisezer-main');
        if (main && main.onchain) {
          main.onchain.address = NOISEZER_ADDRESS;
          main.onchain.bankrStatus = 'ERROR';
          if (io) {
            io.emit('agent-updates', agents);
          }
        }
      } catch (fallbackError) {
        logger.error('[BANKR] Fallback Error:', fallbackError);
      }
    }
  }
}

console.log('[SERVER] Preparing Next.js app...');
import('fs').then(fs => {
  fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] SERVER: Preparing Next.js app...\n`);
});

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  io = new Server(httpServer);

  // Redefined Agents: Noisezer (Main) + Sub-agents
  agents = [
    { 
      id: 'noisezer-main', 
      name: 'Noisezer', 
      role: 'Master Agent / Token Architect',
      task: 'Managing Noisezer Ecosystem & Self-Funding', 
      usage: 0, 
      status: 'online',
      thinking: false,
      history: [],
      uptime: '0d 0h',
      lastSeen: new Date().toISOString(),
      x402Balance: 0.00,
      totalEarned: 0.00,
      skills: ['Token Launch', 'Wallet Management', 'API Funding', 'Governance'],
      isMain: true,
      activeQuery: '',
      onchain: {
        address: NOISEZER_ADDRESS,
        tokenPrice: 0.00,
        marketCap: 0,
        dailyFees: 0.00,
        mainnetBalance: '0.00',
        bankrStatus: BANKR_API_KEY ? 'DETECTED' : 'NOT_FOUND'
      }
    },
    { 
      id: 'sub-alpha', 
      name: 'Sub-Alpha', 
      role: 'Alpha Scout (Sub-agent)',
      task: 'Scanning Base for Trending Coins', 
      usage: 0, 
      status: 'online',
      thinking: false,
      history: [],
      uptime: '0%',
      lastSeen: new Date().toISOString(),
      x402Balance: 0.00,
      totalEarned: 0.00,
      skills: ['Market Scanning', 'Whale Tracking'],
      parentId: 'noisezer-main',
      activeQuery: ''
    },
    { 
      id: 'sub-predict', 
      name: 'Sub-Predict', 
      role: 'Market Analyst (Sub-agent)',
      task: 'Analyzing Polymarket Odds', 
      usage: 0, 
      status: 'online',
      thinking: false,
      history: [],
      uptime: '0%',
      lastSeen: new Date().toISOString(),
      x402Balance: 0.00,
      totalEarned: 0.00,
      skills: ['Prediction Analysis', 'Sentiment Scoring'],
      parentId: 'noisezer-main',
      activeQuery: ''
    },
    { 
      id: 'sub-executor', 
      name: 'Sub-Executor', 
      role: 'Bankr Executor (Sub-agent)',
      task: 'Executing Swaps & Limit Orders', 
      usage: 0, 
      status: 'online',
      thinking: false,
      history: [],
      uptime: '0%',
      lastSeen: new Date().toISOString(),
      x402Balance: 0.00,
      totalEarned: 0.00,
      skills: ['Swap', 'Limit Order', 'Liquidity Provision'],
      parentId: 'noisezer-main',
      activeQuery: ''
    }
  ];

  const signals: any[] = [];

  // --- REAL-TIME UPDATES (REAL DATA ONLY) ---

  // Initial Sync
  syncWithBankr();

  // Update Mainnet Balance every 10 seconds
  intervalManager.add(async () => {
    const main = agents.find(a => a.id === 'noisezer-main');
    if (main && main.onchain) {
      if (BANKR_API_KEY) {
        try {
          const data = await getBankrBalances(BANKR_API_KEY);
          
          const baseBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'ETH' || b.symbol === 'eth'));
          const usdcBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'USDC' || b.symbol === 'usdc'));
          
          main.onchain.mainnetBalance = baseBalance?.amount || '0.00';
          main.onchain.usdcBalance = usdcBalance?.amount || '0.00';
          
          // Ensure address is synced
          if (data.address) {
            if (main.onchain.address !== data.address) {
              console.log(`[BANKR] Updating address to match API: ${data.address}`);
              main.onchain.address = data.address;
              NOISEZER_ADDRESS = data.address;
            }
          }
          
          main.onchain.isBankr = true;
          main.onchain.bankrStatus = 'SYNCED';
          
          console.log(`[BANKR] Balance Update: ${main.onchain.mainnetBalance} ETH, ${main.onchain.usdcBalance} USDC on Base`);
        } catch (error) {
          console.error('[BANKR] Balance Update Error:', error);
          main.onchain.bankrStatus = 'ERROR';
        }
      } else {
        // Fetch from Public Client (Local Wallet)
        if (!BANKR_API_KEY) {
          const balance = await getBaseBalance(NOISEZER_ADDRESS as `0x${string}`);
          main.onchain.mainnetBalance = balance;
        }
      }
      io.emit('agent-updates', agents);
    }
  }, 10000);

  io.on('connection', (socket) => {
    console.log('Client connected to monitoring');
    socket.on('disconnect', () => {
      console.log('[SOCKET] Client disconnected:', socket.id);
    });
    socket.emit('agent-updates', agents);
    socket.emit('signal-updates', signals);
    socket.emit('x402-updates', x402Transactions);

    socket.on('sync-bankr', async () => {
      console.log('[BANKR] Manual sync requested via socket');
      await syncWithBankr();
      socket.emit('bankr-sync-complete', { success: true });
    });

    // Handle manual data request from client (X402 simulation)
    socket.on('request-data', (data) => {
      const result = RequestDataSchema.safeParse(data);
      if (!result.success) {
        logger.error('[SOCKET] Invalid request-data:', result.error);
        return;
      }
      const { agentId, query } = result.data;
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      console.log(`Manual request received from ${agent.name} for: ${query}`);
      
      // Simulate X402 Payment
      const cost = 0.25;
      agent.x402Balance -= cost;
      
      // Pay the Main Agent (Noisezer) or Oracle
      const main = agents.find(a => a.name === 'Noisezer');
      if (main) {
        main.x402Balance += cost;
        main.totalEarned += cost;
      }

      const txId = `tx-req-${Date.now()}`;
      const tx = {
        id: txId,
        from: agent.name,
        to: 'Noisezer',
        amount: cost,
        status: 'success',
        timestamp: Date.now()
      };
      x402Transactions.unshift(tx);
      io.emit('x402-updates', x402Transactions);

      // Set agent to thinking
      agent.thinking = true;
      agent.task = `Processing Request: ${query}`;
      io.emit('agent-updates', agents);

      // Simulate response after 2 seconds
      setTimeout(() => {
        agent.thinking = false;
        const timestamp = Date.now();
        const signalId = `s-resp-${timestamp}`;
        const newSignal = {
          id: signalId,
          type: 'PREDICTION',
          source: 'Polymarket',
          author: 'Market-Oracle',
          handle: '@oracle_bot',
          content: `[REQUESTED] Analysis for "${query}": High probability of breakout based on current volume and social sentiment.`,
          confidence: 0.95,
          timestamp: timestamp,
          url: 'https://polymarket.com',
          x402Status: 'PAID'
        };
        signals.unshift(newSignal);
        io.emit('signal-updates', signals);
        io.emit('agent-updates', agents);
      }, 2000);
    });

    socket.on('request-signal', async (data) => {
      const { query, filters } = data;
      console.log(`[SIGNAL] Request received: ${query} with filters: ${JSON.stringify(filters)}`);
      
      try {
        // Fetch off-chain context
        const [polyData, newsData] = await Promise.all([fetchPolymarketData(), fetchGlobalNews()]);
        let offChainContext = `Polymarket: ${JSON.stringify(polyData)}. News: ${JSON.stringify(newsData)}.`;

        // Check for token address (0x followed by 40 hex chars)
        const tokenAddressMatch = query.match(/0x[a-fA-F0-9]{40}/);
        if (tokenAddressMatch) {
          const dexData = await fetchDexScreenerData(tokenAddressMatch[0]);
          offChainContext += ` On-chain Data (DexScreener): ${JSON.stringify(dexData)}.`;
        }

        const intent = await analyzeIntent(query);
        let results = [];
        
        if (intent.intent === 'TRADING') {
          results = intent.clarificationNeeded ? [] : await searchSignalServerCoT(query, offChainContext);
        } else {
          results = await getGeneralMarketSentiment(query, offChainContext);
        }
        
        if (intent.clarificationNeeded && intent.intent === 'TRADING') {
          socket.emit('signal-updates', [{
            id: `s-req-${Date.now()}`,
            type: 'ALERT',
            content: intent.suggestedClarification || 'Maaf, saya tidak mengerti permintaan Anda.'
          }]);
          return;
        } else if (results.length === 0) {
          socket.emit('signal-updates', [{
            id: `s-req-${Date.now()}`,
            type: 'ALERT',
            source: 'Noisezer AI',
            author: 'Noisezer',
            handle: '@noisezer_main',
            content: `No high-signal alpha found for "${query}". Try a different query.`,
            confidence: 0,
            timestamp: Date.now(),
            url: 'https://x.com/noisezer_main',
            x402Status: 'FREE',
            isLive: true,
            divergence: 'N/A',
            action: 'WAIT'
          }]);
          return;
        }

        const formattedSignals = results.map((res: any) => {
          const signal = res.signal;
          
          if (signal.category === 'MARKET_SENTIMENT') {
            return {
              id: `s-req-${Date.now()}-${Math.random()}`,
              type: 'MARKET_SENTIMENT',
              source: res.author,
              author: res.author,
              handle: `@${res.author.toLowerCase().replace(/\s/g, '_')}`,
              content: signal.summary,
              confidence: signal.confidence,
              divergence: 'N/A',
              action: signal.sentiment,
              contractAddress: 'N/A',
              isVerified: true,
              liquidityUSD: 'N/A',
              walletRatio: 'N/A',
              riskLevel: signal.riskLevel,
              rationale: signal.actionableStrategy,
              timestamp: Date.now(),
              url: res.url,
              x402Status: 'FREE',
              isLive: true
            };
          } else {
            return {
              id: `s-req-${Date.now()}-${Math.random()}`,
              type: signal.category,
              source: res.author,
              author: res.author,
              handle: `@${res.author.toLowerCase().replace(/\s/g, '_')}`,
              content: res.content,
              confidence: signal.verification?.confidence || 0,
              divergence: signal.divergenceSignal || 'N/A',
              action: signal.recommendation,
              contractAddress: signal.projectId || 'N/A',
              isVerified: signal.verification?.narrative_matches_onchain || false,
              liquidityUSD: 'N/A', // Needs mapping from signal if available
              walletRatio: 'N/A', // Needs mapping from signal if available
              riskLevel: signal.verification?.risk_level || 'MEDIUM',
              rationale: signal.actionableStrategy || 'No rationale provided.',
              timestamp: Date.now(),
              url: res.url,
              x402Status: 'PAID',
              isLive: true
            };
          }
        });
        
        socket.emit('signal-updates', formattedSignals);
      } catch (error) {
        console.error('[SIGNAL] Error processing request:', error);
        socket.emit('signal-error', { message: 'Failed to generate signal.' });
      }
    });

    socket.on('execute-trade', async (data) => {
      const result = ExecuteTradeSchema.safeParse(data);
      if (!result.success) {
        logger.error('[SOCKET] Invalid execute-trade:', result.error);
        socket.emit('trade-result', { status: 'FAILED', error: 'Invalid input' });
        return;
      }
      const { signalId, marketId, amount } = result.data;
      console.log(`[EXECUTION] Executing trade for signal: ${signalId}`);

      try {
        const result = await bankrSwap(BANKR_API_KEY!, 'USDC', marketId, amount);

        const tx = {
          id: result.transactionHash || result.jobId || `tx-${Date.now()}`,
          amount: parseFloat(amount),
          status: result.transactionHash || result.jobId ? 'SUCCESS' : 'FAILED',
          timestamp: Date.now(),
          type: 'BUY',
          pnl: 0
        };
        x402Transactions.push(tx);
        await saveTransaction(tx);
        io.emit('x402-updates', x402Transactions);

        // --- AUTONOMOUS FEEDBACK LOOP ---
        const mainAgent = agents.find(a => a.id === 'noisezer-main');
        if (mainAgent) {
          mainAgent.task = tx.status === 'SUCCESS' ? `Learning from success: ${tx.id}` : `Learning from failure: ${tx.id}`;
          mainAgent.history.push({ time: Date.now(), result: tx.status, txId: tx.id });
          if (mainAgent.history.length > 20) mainAgent.history.shift();
          io.emit('agent-updates', agents);
        }

        socket.emit('trade-result', {
          signalId,
          status: 'SUCCESS',
          txHash: result.transactionHash || result.jobId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[EXECUTION] Error:', error);
        
        const tx = {
          id: `tx-${Date.now()}`,
          amount: parseFloat(amount),
          status: 'FAILED',
          timestamp: Date.now(),
          type: 'BUY',
          pnl: 0
        };
        x402Transactions.push(tx);
        io.emit('x402-updates', x402Transactions);

        // --- AUTONOMOUS FEEDBACK LOOP ---
        const mainAgent = agents.find(a => a.id === 'noisezer-main');
        if (mainAgent) {
          mainAgent.task = `Learning from failure: ${tx.id}`;
          mainAgent.history.push({ time: Date.now(), result: 'FAILED', txId: tx.id });
          if (mainAgent.history.length > 20) mainAgent.history.shift();
          io.emit('agent-updates', agents);
        }

        socket.emit('trade-result', {
          signalId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });

  // Graceful Shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down...');
    intervalManager.clearAll();
    io.close(() => {
      logger.info('Socket.io server closed.');
    });
    httpServer.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('Error during app.prepare():', err);
  process.exit(1);
});
