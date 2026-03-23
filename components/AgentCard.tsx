'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, Shield, Zap, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';

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

export function AgentCard({ agent }: { agent: Agent }) {
  const [mounted, setMounted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const isOnline = agent.status === 'online';

  useEffect(() => {
    setMounted(true);
  }, []);

  const socket = useSocket();

  const handleRequestData = () => {
    if (isRequesting || agent.thinking) return;
    
    setIsRequesting(true);
    
    const query = agent.activeQuery || 'Market Sentiment Analysis';
    
    socket.emit('request-data', {
      agentId: agent.id,
      query: query
    });

    toast.success(`X402 Payment Sent: 0.25 USD from ${agent.name}`, {
      description: `Requesting data for: ${query}`,
      duration: 3000,
    });

    // Reset requesting state locally, server will update agent.thinking
    setTimeout(() => {
      setIsRequesting(false);
    }, 1000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#151619] border rounded-xl p-4 transition-all group relative overflow-hidden",
        agent.thinking ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-white/5 hover:border-white/10",
        agent.isMain && "border-purple-500/30 bg-purple-500/[0.02]"
      )}
    >
      {/* Background Chart Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={agent.history || []}>
            <Area 
              type="monotone" 
              dataKey="usage" 
              stroke="#10b981" 
              fill="#10b981" 
              strokeWidth={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500",
              agent.thinking && "animate-pulse scale-110",
              agent.isMain && "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50"
            )}>
              {agent.thinking ? <Loader2 size={20} className="animate-spin" /> : (
                agent.isMain ? <Shield size={20} className="text-purple-400" /> :
                agent.name.includes('Bankr') || agent.role.includes('Executor') ? <Activity size={20} className="text-purple-400" /> :
                agent.role.includes('Alpha') ? <Zap size={20} /> : 
                agent.role.includes('Predict') || agent.role.includes('Poly') ? <Activity size={20} /> : 
                agent.role.includes('Security') ? <Shield size={20} /> : 
                <Cpu size={20} />
              )}
            </div>
            <div>
              <h3 className="font-mono text-sm font-medium tracking-tight uppercase flex items-center gap-2">
                {agent.name}
                {agent.isMain && <span className="text-[8px] bg-emerald-500 text-black px-1 rounded font-bold">TRUTH FILTER</span>}
                {agent.parentId && <span className="text-[8px] border border-zinc-700 text-zinc-500 px-1 rounded">SUB-AGENT</span>}
                {agent.thinking && <span className="text-[8px] bg-emerald-500/20 text-emerald-500 px-1 rounded animate-pulse border border-emerald-500/30">THINKING</span>}
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{agent.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
            )} />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{agent.status}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className={cn(
            "rounded-lg p-2 border backdrop-blur-sm transition-colors",
            agent.thinking ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/20 border-white/5"
          )}>
            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Current Task</p>
            <p className="text-xs font-mono text-zinc-300 truncate">
              {agent.thinking ? "Processing data request..." : agent.task}
            </p>
          </div>

          {agent.activeQuery && (
            <div className="bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10 backdrop-blur-sm relative group/query">
              <p className="text-[10px] text-emerald-500/70 uppercase font-mono mb-1 flex items-center gap-1">
                <Activity size={10} /> Hunting Topic
              </p>
              <p className="text-xs font-mono text-emerald-400 truncate font-bold">{agent.activeQuery}</p>
              
              {/* Request Button Overlay */}
              <button 
                onClick={handleRequestData}
                disabled={agent.thinking || isRequesting}
                className="absolute inset-0 bg-emerald-500 opacity-0 group-hover/query:opacity-100 transition-opacity flex items-center justify-center gap-2 text-black font-mono text-[10px] font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={12} />
                Request Deep Analysis ($0.25)
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Load</p>
              <div className="flex items-end gap-1">
                <span className="text-sm font-mono text-white">{agent.usage}</span>
                <span className="text-[10px] text-zinc-500 font-mono mb-0.5">OPS</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1">X402 Balance</p>
              <div className="flex items-end gap-1">
                <span className="text-sm font-mono text-emerald-500">${(agent.x402Balance || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* On-chain Stats for Main Agent */}
          {agent.isMain && agent.onchain && (
            <div className="bg-purple-500/5 rounded-lg p-3 border border-purple-500/10 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-mono flex items-center gap-1">
                  <Shield size={10} /> Base Mainnet Stats
                </span>
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20 uppercase tracking-tighter">LIVE</span>
                {agent.onchain.isBankr ? (
                  <span className="text-[8px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-tighter ml-1">
                    BANKR: {agent.onchain.bankrStatus || 'CONNECTED'}
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter ml-1">
                    BANKR: MISSING API KEY
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-mono mb-0.5">Price</p>
                  <p className="text-xs font-mono text-white">${agent.onchain.tokenPrice.toFixed(3)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-mono mb-0.5">Daily Fees</p>
                  <p className="text-xs font-mono text-emerald-400">+${agent.onchain.dailyFees.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                  <p className="text-[9px] text-emerald-500 uppercase font-mono mb-0.5">ETH Balance</p>
                  <p className="text-xs font-mono text-white flex items-center gap-1">
                    <Zap size={10} className="text-emerald-500" />
                    {agent.onchain.mainnetBalance || '0.00'}
                  </p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-[9px] text-blue-400 uppercase font-mono mb-0.5">USDC Balance</p>
                  <p className="text-xs font-mono text-white flex items-center gap-1">
                    <Shield size={10} className="text-blue-400" />
                    {agent.onchain.usdcBalance || '0.00'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-[9px] font-mono pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 uppercase">Wallet Address:</span>
                  <button 
                    onClick={() => socket.emit('sync-bankr')}
                    className="text-[8px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Activity size={8} /> Refresh
                  </button>
                </div>
                <div 
                  className="text-zinc-400 hover:text-white cursor-pointer transition-colors break-all bg-black/40 p-1.5 rounded border border-white/5"
                  onClick={() => {
                    navigator.clipboard.writeText(agent.onchain!.address);
                    toast.success("Address copied to clipboard");
                  }}
                >
                  {agent.onchain.address}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button 
                  className="py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-[10px] font-mono text-purple-400 uppercase font-bold transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    socket.emit('execute-swap', {
                      agentId: agent.id,
                      from: 'USDC',
                      to: 'ETH',
                      amount: '1'
                    });
                    toast.info("USDC Swap Initiated", {
                      description: "Swapping 1 USDC to ETH on Base Mainnet via Bankr...",
                    });
                  }}
                >
                  <Zap size={10} /> Swap 1 USDC
                </button>
                <button 
                  className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-lg text-[10px] font-mono text-emerald-400 uppercase font-bold transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    socket.emit('execute-swap', {
                      agentId: agent.id,
                      from: 'ETH',
                      to: 'USDC',
                      amount: '0.001'
                    });
                    toast.info("ETH Swap Initiated", {
                      description: "Swapping 0.001 ETH to USDC on Base Mainnet via Bankr...",
                    });
                  }}
                >
                  <Shield size={10} /> Swap 0.001 ETH
                </button>
              </div>
            </div>
          )}

          {agent.skills && agent.skills.length > 0 && (
            <div className="bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1.5 flex items-center gap-1">
                <Zap size={10} className="text-purple-400" /> Agent Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {agent.skills.map((skill, i) => (
                  <span key={i} className="text-[8px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-tighter">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Last seen: {mounted ? new Date(agent.lastSeen).toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
          <button className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase transition-colors">
            Logs
          </button>
        </div>
      </div>
    </motion.div>
  );
}
