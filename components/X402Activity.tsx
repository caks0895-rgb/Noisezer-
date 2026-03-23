'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, ArrowRight, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: string;
  timestamp: number;
}

export function X402Activity({ transactions }: { transactions: Transaction[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="bg-[#151619] border border-white/5 rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-500" />
          <h2 className="font-mono text-sm font-medium tracking-tight uppercase">X402 Agent Payments</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-500/50 uppercase">Live Settlement</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black/20 border border-white/5 rounded-lg p-3 flex items-center justify-between group hover:border-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <DollarSign size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">{tx.from}</span>
                    <ArrowRight size={10} className="text-zinc-600" />
                    <span className="text-[10px] font-mono text-emerald-500 uppercase">{tx.to}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-zinc-600" />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {mounted ? new Date(tx.timestamp).toLocaleTimeString() : '--:--:--'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white font-bold">+${tx.amount.toFixed(2)}</p>
                <p className="text-[8px] font-mono text-emerald-500/50 uppercase">Settled</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="p-3 border-t border-white/5 bg-black/40">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase">
          <span className="text-zinc-500">Protocol Revenue (24h)</span>
          <span className="text-emerald-500">$142.50</span>
        </div>
      </div>
    </div>
  );
}
