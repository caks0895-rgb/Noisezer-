'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowUpRight, Globe, TrendingUp, Zap, User, Loader2, Activity, Lock, Unlock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { executeTrade } from '../lib/trade-engine';

interface Signal {
  id: string;
  contract_address: string;
  noise_score: number;
  manipulation_score: number;
  divergence_score: number;
  anomaly_score: number;
  action: 'PROCESS' | 'IGNORE' | 'WATCH';
  primary_reason: string;
  confidence: number;
  timestamp: number;
}

export function SignalFeed({ signals, isAnyAgentThinking }: { signals: Signal[], isAnyAgentThinking?: boolean }) {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  return (
    <div className="bg-[#151619] border border-white/5 rounded-xl flex flex-col h-full relative overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-mono text-sm font-medium tracking-tight uppercase">Decision Gatekeeper</h2>
        {isAnyAgentThinking && <span className="text-[8px] font-mono text-indigo-500 uppercase animate-pulse">Analyzing...</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(signals || []).map((signal, index) => (
          <div
            key={signal.id || index}
            className={cn(
              "bg-black/20 border rounded-lg p-4 cursor-pointer transition-all",
              signal.action === 'PROCESS' ? "border-emerald-500/30" : 
              signal.action === 'IGNORE' ? "border-rose-500/30" : "border-amber-500/30"
            )}
            onClick={() => setSelectedSignal(signal)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-xs font-mono font-bold uppercase",
                signal.action === 'PROCESS' ? "text-emerald-500" : 
                signal.action === 'IGNORE' ? "text-rose-500" : "text-amber-500"
              )}>{signal.action}</span>
              <span className="text-[10px] font-mono text-zinc-500">Score: {signal.noise_score}/100</span>
            </div>
            <p className="text-xs text-zinc-300 font-mono">{signal.primary_reason}</p>
          </div>
        ))}
      </div>

      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSignal(null)}>
          <div className="bg-[#151619] border border-white/10 rounded-2xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-mono font-bold text-white mb-4">Analysis Detail</h2>
            <div className="space-y-3 text-xs font-mono text-zinc-400">
              <p>Contract: {selectedSignal.contract_address}</p>
              <p>Noise Score: {selectedSignal.noise_score}</p>
              <p>Manipulation: {(selectedSignal.manipulation_score * 100).toFixed(0)}%</p>
              <p>Divergence: {(selectedSignal.divergence_score * 100).toFixed(0)}%</p>
              <p>Anomaly: {(selectedSignal.anomaly_score * 100).toFixed(0)}%</p>
              <p>Confidence: {(selectedSignal.confidence * 100).toFixed(0)}%</p>
              <p className="pt-4 text-white">Reason: {selectedSignal.primary_reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
