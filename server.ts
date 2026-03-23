import { createServer } from 'http';
console.log('[SERVER] Starting Noisezer Agent...');
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import Parser from 'rss-parser';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getBaseBalance, bankrSwap, getBankrJobStatus, getBankrBalances, bankrPrompt } from './lib/blockchain';
import { searchSignalServer } from './lib/gemini-server';
import * as dotenv from 'dotenv';
dotenv.config();

// Persistent Noisezer Wallet from Environment or Temporary for Session
const NOISEZER_PRIVATE_KEY = (process.env.NOISEZER_PRIVATE_KEY as `0x${string}`) || generatePrivateKey();
const BANKR_API_KEY = process.env.BANKR_API_KEY || process.env.BANKR_KEY || process.env.NOISEZER_BANKR_API_KEY;

// Noisezer Official Wallet Address from System Instructions
const OFFICIAL_NOISEZER_ADDRESS = '0xfaaa2fd28530524818154968048738a614d4b1e2';

// If BANKR_API_KEY is present, we start with a placeholder to avoid showing the wrong address
let NOISEZER_ADDRESS = BANKR_API_KEY ? 'Syncing with Bankr...' : (process.env.NOISEZER_PRIVATE_KEY ? privateKeyToAccount(NOISEZER_PRIVATE_KEY).address : OFFICIAL_NOISEZER_ADDRESS);

if (BANKR_API_KEY) {
  console.log(`✅ BANKR_API_KEY detected (Length: ${BANKR_API_KEY.length}). Noisezer is now in Managed Wallet mode.`);
  import('fs').then(fs => {
    fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] STARTUP: BANKR_API_KEY detected with length ${BANKR_API_KEY.length}\n`);
  });
} else {
  console.warn('❌ BANKR_API_KEY not found. Noisezer is in Self-Managed (Temporary) mode.');
  import('fs').then(fs => {
    fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] STARTUP: BANKR_API_KEY is MISSING\n`);
  });
}

if (!process.env.NOISEZER_PRIVATE_KEY) {
  console.warn('!!! WARNING: NOISEZER_PRIVATE_KEY not found in environment. Generating a temporary wallet for this session only.');
  console.log(`[NOISEZER] TEMP Mainnet Wallet: ${NOISEZER_ADDRESS}`);
  console.log(`[NOISEZER] TEMP PRIVATE KEY: ${NOISEZER_PRIVATE_KEY.substring(0, 6)}...`);
  console.log('To make this permanent, add NOISEZER_PRIVATE_KEY to your Secrets in AI Studio Settings.');
} else {
  console.log(`[NOISEZER] Persistent Mainnet Wallet Loaded: ${NOISEZER_ADDRESS}`);
}

const parser = new Parser();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 3000;

let io: Server;
let agents: any[] = [];
let x402Transactions: any[] = [];

async function pollSignals() {
  if (!BANKR_API_KEY) return;
  console.log('[NOISEZER] Polling for new signals...');
  try {
    const signals = await searchSignalServer('Base chain alpha opportunities');
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

// Run polling every 5 minutes
setInterval(pollSignals, 5 * 60 * 1000);

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
setInterval(autonomousOperations, 30 * 60 * 1000);

// Initial run after a short delay
setTimeout(autonomousOperations, 10000);

async function syncWithBankr() {
  if (BANKR_API_KEY) {
    try {
      console.log('[BANKR] Syncing wallet info...');
      const data = await getBankrBalances(BANKR_API_KEY);
      
      // Debug log to file
      const fs = await import('fs');
      fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] Sync Data: ${JSON.stringify(data)}\n`);
      
      if (data && data.address) {
        NOISEZER_ADDRESS = data.address;
        console.log(`[BANKR] SUCCESS: Synced with Bankr Wallet: ${NOISEZER_ADDRESS}`);
        
        // Update agent info
        const main = agents.find(a => a.id === 'noisezer-main');
        if (main) {
          console.log('[BANKR] Found Noisezer Main Agent, updating onchain data...');
          if (main.onchain) {
            main.onchain.address = NOISEZER_ADDRESS;
            main.onchain.isBankr = true;
            main.onchain.bankrStatus = 'SYNCED';
            
            // Also update balances immediately
            const baseBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'ETH' || b.symbol === 'eth'));
            const usdcBalance = data.balances?.find((b: any) => b.chain === 'base' && (b.symbol === 'USDC' || b.symbol === 'usdc'));
            main.onchain.mainnetBalance = baseBalance?.amount || '0.00';
            main.onchain.usdcBalance = usdcBalance?.amount || '0.00';
            console.log(`[BANKR] Initial Balances: ${main.onchain.mainnetBalance} ETH, ${main.onchain.usdcBalance} USDC`);
            console.log(`[BANKR] Updated Agent Address to: ${main.onchain.address}`);
          }
        } else {
          console.warn('[BANKR] Could not find Noisezer Main Agent in agents array!');
        }
        if (io) {
          io.emit('bankr-sync-success', { address: NOISEZER_ADDRESS });
          io.emit('agent-updates', agents);
        }
      } else {
        throw new Error('No address returned from Bankr API');
      }
    } catch (error) {
      console.error('[BANKR] Sync Error:', error);
      
      // Fallback to local wallet if Bankr sync fails
      try {
        NOISEZER_ADDRESS = privateKeyToAccount(NOISEZER_PRIVATE_KEY).address;
        console.log(`[BANKR] FALLBACK: Using Local Wallet: ${NOISEZER_ADDRESS}`);
        
        const main = agents.find(a => a.id === 'noisezer-main');
        if (main && main.onchain) {
          main.onchain.address = NOISEZER_ADDRESS;
          main.onchain.bankrStatus = 'ERROR';
          if (io) {
            io.emit('agent-updates', agents);
          }
        }
      } catch (fallbackError) {
        console.error('[BANKR] Fallback Error:', fallbackError);
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

  // --- DATA FETCHERS (BOOTSTRAP VERSION) ---
  
  // Fetch real data from Polymarket (Gamma API - Public)
  async function fetchPolymarketData() {
    try {
      const res = await fetch('https://gamma-api.polymarket.com/markets?active=true&limit=10&order=volume&ascending=false');
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[POLYMARKET] Successfully fetched ${data.length} live markets.`);
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
      console.warn(`[POLY_FALLBACK] Using simulated markets: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return [
        { id: 'poly-1', question: 'Will ETH hit $5000 in March?', probability: 0.15, volume: '1.2M', isLive: false },
        { id: 'poly-2', question: 'US Presidential Election Winner', probability: 0.52, volume: '450M', isLive: false },
        { id: 'poly-3', question: 'Will Base L3 launch before Q3?', probability: 0.78, volume: '800K', isLive: false }
      ];
    }
  }

  // Fetch News for Alpha (FREE SOURCES - $0 COST)
  async function fetchGlobalNews() {
    try {
      // Sources: CoinDesk (Crypto), CNBC (Business), and CryptoPanic (Aggregator)
      const feeds = [
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=crypto',
        'https://cryptopanic.com/news/rss/'
      ];
      
      // Randomly pick one to avoid rate limiting
      const feedUrl = feeds[Math.floor(Math.random() * feeds.length)];
      const feed = await parser.parseURL(feedUrl);
      
      if (feed.items && feed.items.length > 0) {
        console.log(`[FREE_NEWS] Successfully fetched ${feed.items.length} articles from ${feed.title}.`);
        return feed.items.slice(0, 10).map(item => ({
          title: item.title || '',
          isLive: true
        }));
      }
      throw new Error('No items in feed');
    } catch (e) {
      console.warn(`[NEWS_FALLBACK] Using simulated news: ${e instanceof Error ? e.message : 'Unknown error'}`);
      // Fallback realistic news if RSS fails
      return [
        { title: "SEC signals potential approval for new Ethereum scaling solutions.", isLive: false },
        { title: "Major whale moves $500M USDC to Base Chain liquidity pools.", isLive: false },
        { title: "Base Chain daily active addresses hit new all-time high.", isLive: false }
      ];
    }
  }

  // --- SIMULATION LOOP ---

  // Broadcast updates every 3 seconds
  setInterval(async () => {
    const polyData = await fetchPolymarketData();
    const newsData = await fetchGlobalNews();

    agents.forEach(agent => {
      // Noisezer Main Logic
      if (agent.name === 'Noisezer') {
        const mainTasks = [
          'Optimizing Self-Funding Model',
          'Allocating Fees to Gemini API',
          'Governing Sub-agent Workflows',
          'Monitoring Noisezer Token Health',
          'Analyzing Ecosystem Revenue'
        ];
        agent.task = mainTasks[Math.floor(Math.random() * mainTasks.length)];
      } 
      // Sub-Predict Logic
      else if (agent.name === 'Sub-Predict') {
        const targetMarket = polyData[Math.floor(Math.random() * polyData.length)];
        agent.task = `Analyzing: ${targetMarket.question}`;
        agent.activeQuery = targetMarket.question;
      } 
      // Sub-Executor Logic
      else if (agent.name === 'Sub-Executor') {
        const tradingTasks = [
          'Monitoring DEX Liquidity',
          'Checking Limit Order Conditions',
          'Optimizing Swap Routing',
          'Executing Buy-back Sequence',
          'Managing Treasury Swaps'
        ];
        agent.task = tradingTasks[Math.floor(Math.random() * tradingTasks.length)];
      } 
      else {
        const tasks = ['Scanning Base Chain', 'Analyzing X402 Protocol', 'Filtering Spam', 'Verifying Evidence', 'Calculating Signal Score'];
        agent.task = tasks[Math.floor(Math.random() * tasks.length)];
      }

      // Randomly set thinking state
      if (Math.random() > 0.7) {
        agent.thinking = true;
        setTimeout(() => { agent.thinking = false; }, 1500);
      }

      const newUsage = Math.floor(Math.random() * 5);
      agent.usage += newUsage;
      
      // Update X402 Balance simulation (Self-Funding Logic)
      if (Math.random() > 0.8) {
        const earnings = Number((Math.random() * 1.5).toFixed(2));
        agent.x402Balance += earnings;
        agent.totalEarned += earnings;
        
        // If sub-agent earns, send a portion to Noisezer (Main)
        if (agent.parentId === 'noisezer-main') {
          const tax = Number((earnings * 0.2).toFixed(2));
          const main = agents.find(a => a.id === 'noisezer-main');
          if (main) {
            main.x402Balance += tax;
            agent.x402Balance -= tax;
          }
        }
        
        // Add to transactions
        const txId = `tx${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const tx = {
          id: txId,
          from: agent.parentId ? agent.name : 'External Protocol',
          to: agent.parentId ? 'Noisezer' : agent.name,
          amount: earnings,
          status: 'success',
          timestamp: Date.now()
        };
        x402Transactions.unshift(tx);
        if (x402Transactions.length > 20) x402Transactions.pop();
        io.emit('x402-updates', x402Transactions);
      }

      // Update history (keep last 10 points)
      agent.history.push({ time: agent.history.length, usage: agent.usage });
      if (agent.history.length > 20) agent.history.shift();
      
      agent.status = Math.random() > 0.1 ? 'online' : 'reconnecting';
      agent.lastSeen = new Date().toISOString();
    });

    io.emit('agent-updates', agents);
  }, 3000);

  // Initial Sync
  syncWithBankr();

  // Update Mainnet Balance every 10 seconds
  setInterval(async () => {
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
      const { agentId, query } = data;
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
        const results = await searchSignalServer(query);
        
        if (results.length === 0) {
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

        const formattedSignals = results.map((res: any) => ({
          id: `s-req-${Date.now()}-${Math.random()}`,
          type: res.signal.category,
          source: res.author,
          author: res.author,
          handle: `@${res.author.toLowerCase().replace(/\s/g, '_')}`,
          content: res.content,
          confidence: res.signal.score / 100,
          divergence: res.signal.divergence,
          action: res.signal.action,
          timestamp: Date.now(),
          url: res.url,
          x402Status: 'PAID',
          isLive: true
        }));
        
        socket.emit('signal-updates', formattedSignals);
      } catch (error) {
        console.error('[SIGNAL] Error processing request:', error);
        socket.emit('signal-error', { message: 'Failed to generate signal.' });
      }
    });

    socket.on('execute-trade', async (data) => {
      const { signalId, marketId, amount } = data;
      console.log(`[EXECUTION] Executing trade for signal: ${signalId}`);

      try {
        const result = await bankrSwap(BANKR_API_KEY!, 'USDC', marketId, amount);

        x402Transactions.push({
          id: result.transactionHash || result.jobId || `tx-${Date.now()}`,
          amount: parseFloat(amount),
          status: result.transactionHash || result.jobId ? 'SUCCESS' : 'FAILED',
          timestamp: Date.now(),
          type: 'BUY', // Assuming BUY for now, need to infer from signal
          pnl: 0 // Placeholder
        });
        io.emit('x402-updates', x402Transactions);

        socket.emit('trade-result', {
          signalId,
          status: 'SUCCESS',
          txHash: result.transactionHash || result.jobId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[EXECUTION] Error:', error);
        
        x402Transactions.push({
          id: `tx-${Date.now()}`,
          amount: parseFloat(amount),
          status: 'FAILED',
          timestamp: Date.now(),
          type: 'BUY',
          pnl: 0
        });
        io.emit('x402-updates', x402Transactions);

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
}).catch((err) => {
  console.error('Error during app.prepare():', err);
  process.exit(1);
});
