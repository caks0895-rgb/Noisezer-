'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowUpRight, Globe, TrendingUp, Zap, User, Loader2, Activity, Lock, Unlock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { executeTrade } from '../lib/trade-engine';

interface Signal {
  id: string;
  contract_address?: string;
  noise_score?: number;
  action?: 'PROCESS' | 'IGNORE' | 'WATCH';
  primary_reason?: string;
  confidence?: number;
  timestamp: number;
  status?: 'VERIFIED' | 'NOT_VERIFIED';
  source?: string;
  // Truth Report fields
  analysis_summary?: string;
  risk_assessment?: string;
  disclaimer?: string;
}

export function SignalFeed({ signals, isAnyAgentThinking }: { signals: Signal[], isAnyAgentThinking?: boolean }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#111]">
        <h2 className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-400">Live Insights</h2>
        {isAnyAgentThinking && <span className="text-[9px] font-mono text-indigo-500 uppercase animate-pulse">Processing...</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {(signals || []).map((signal, index) => {
          const isTruthReport = !!signal.analysis_summary;
          
          return (
            <div
              key={signal.id || index}
              className={cn(
                "border rounded-md p-3 transition-all font-mono text-xs",
                isTruthReport 
                  ? "bg-rose-950/20 border-rose-500/30"
                  : signal.status === 'NOT_VERIFIED' ? "bg-amber-950/20 border-amber-500/30" : "bg-emerald-950/20 border-emerald-500/30"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "font-bold uppercase",
                  isTruthReport ? "text-rose-500" : signal.status === 'NOT_VERIFIED' ? "text-amber-500" : "text-emerald-500"
                )}>
                  {isTruthReport ? 'TRUTH REPORT' : (signal.status || 'SIGNAL')}
                </span>
                <span className="text-zinc-500">{new Date(signal.timestamp).toLocaleTimeString()}</span>
              </div>
              
              {isTruthReport ? (
                <div className="space-y-2">
                  <p className="text-zinc-200 leading-tight"><span className="text-rose-400 font-bold">Risk:</span> {signal.risk_assessment}</p>
                  <p className="text-zinc-300 leading-tight italic">{signal.analysis_summary}</p>
                </div>
              ) : (
                <p className="text-zinc-200 leading-tight">{signal.primary_reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
