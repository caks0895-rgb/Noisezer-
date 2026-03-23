'use client';

import { Activity, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function MarketTab({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#151619] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={16} className="text-indigo-500" />
          <h2 className="font-mono text-sm font-medium tracking-tight uppercase">Trade History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 font-mono text-xs">No transactions executed yet.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center",
                    tx.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500" :
                    tx.status === 'FAILED' ? "bg-rose-500/10 text-rose-500" :
                    "bg-zinc-500/10 text-zinc-500"
                  )}>
                    {tx.status === 'SUCCESS' ? <CheckCircle size={16} /> :
                     tx.status === 'FAILED' ? <XCircle size={16} /> :
                     <Clock size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-white font-bold">{tx.type}</p>
                      <p className="text-xs font-mono text-white font-bold">{tx.amount} USDC</p>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-mono font-bold", 
                    (tx.pnl || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {tx.pnl !== undefined ? (tx.pnl >= 0 ? '+' : '') + tx.pnl.toFixed(2) + ' USDC' : 'N/A'}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase">{tx.status}</p>
                  <p className="text-[9px] font-mono text-zinc-600 break-all">{tx.id.startsWith('tx-') ? 'Pending...' : tx.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
