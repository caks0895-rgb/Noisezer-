'use client';

import { useEffect, useState } from 'react';
import { Shield, Wallet, Activity, Database, DollarSign, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { Tabs, Tab } from '@/components/Tabs';
import { DashboardTab } from '@/components/DashboardTab';
import { SignalTab } from '@/components/SignalTab';
import { MarketTab } from '@/components/MarketTab';
import { LandingPage } from '@/components/LandingPage';
import { NoisezerLogo } from '@/components/Logo';

// ... (Agent, Signal, Transaction interfaces remain the same)
interface Agent {
  id: string;
  name: string;
  role: string;
  task: string;
  usage: number;
  status: string;
  uptime: string;
  lastSeen: string;
  history: { time: number; usage: number }[];
  x402Balance?: number;
  totalEarned?: number;
  activeQuery?: string;
  thinking?: boolean;
  skills?: string[];
  isMain?: boolean;
  parentId?: string;
  onchain?: {
    address: string;
    tokenPrice: number;
    marketCap: number;
    dailyFees: number;
    mainnetBalance?: string;
    usdcBalance?: string;
    isBankr?: boolean;
    bankrStatus?: string;
  };
}

interface Signal {
  id: string;
  type: string;
  source: string;
  author?: string;
  handle?: string;
  title?: string;
  content: string;
  confidence: number;
  timestamp: number;
  url?: string;
  x402Status?: 'PAID' | 'FREE';
  isLive?: boolean;
  isLocked?: boolean;
  recommendation?: {
    label: string;
    color: string;
  };
  skillDetails?: {
    type: string;
    from: string;
    to: string;
    amount: string;
  };
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  pnl?: number;
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    fetch('/api/discovery')
      .then(res => res.json())
      .then(data => setInsights(data.insights))
      .catch(err => console.error('Failed to fetch insights:', err));
    
    // Fetch initial signals
    fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: `Base chain alpha ${Date.now()}` })
    })
      .then(res => res.json())
      .then(data => setSignals(data))
      .catch(err => console.error('Failed to fetch signals:', err));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => setConnected(true));
    socket.on('agent-updates', (data: Agent[]) => setAgents(data));
    socket.on('signal-updates', (data: Signal[]) => setSignals(data));
    socket.on('x402-updates', (data: Transaction[]) => setTransactions(data));
    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, [socket]);

  const isAnyAgentThinking = agents.some(a => a.thinking);
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const stats = [
    { label: 'Network Load', value: `${agents.length * 10}%`, icon: <Activity size={16} />, color: 'text-emerald-500' },
    { label: 'X402 Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={16} />, color: 'text-emerald-400' },
    { label: 'Active Agents', value: `${agents.length}`, icon: <ShieldCheck size={16} />, color: 'text-amber-500' },
    { label: 'Base Chain OPS', value: '1.2M', icon: <Database size={16} />, color: 'text-blue-500' },
  ];

  if (!showDashboard) {
    return <LandingPage onEnter={() => setShowDashboard(true)} />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#0A0A0B]">
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <NoisezerLogo className="w-8 h-8" />
          <h1 className="font-mono text-lg font-bold tracking-tighter uppercase">Noisezer</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full px-4 py-1.5 hover:bg-indigo-500/20 transition-all group">
            <Wallet size={16} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Connect Wallet</span>
          </button>
        </div>
      </nav>
      
      {/* ... (rest of the dashboard return) */}

      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-[0.2em] font-bold">System Online</span>
            <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-indigo-500 animate-pulse" : "bg-rose-500")} />
          </div>
          <h2 className="text-3xl font-mono font-medium tracking-tight uppercase">Noisezer Truth Filter</h2>
        </div>

        <Tabs>
          <Tab label="Dashboard">
            <DashboardTab agents={agents} insights={insights} stats={stats} />
          </Tab>
          <Tab label="Noisezer">
            <SignalTab signals={signals} isAnyAgentThinking={isAnyAgentThinking} socket={socket} />
          </Tab>
          <Tab label="Market">
            <MarketTab transactions={transactions} />
          </Tab>
          <Tab label="Settings">
            <div className="text-center py-20 text-zinc-500 font-mono text-xs">Wallet and Agent configuration settings.</div>
          </Tab>
        </Tabs>
      </div>
    </main>
  );
}
