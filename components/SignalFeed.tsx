'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowUpRight, Globe, TrendingUp, Zap, User, Loader2, Activity, Lock, Unlock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  divergence?: string;
  action?: string;
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

export function SignalFeed({ signals, isAnyAgentThinking, socket }: { signals: Signal[], isAnyAgentThinking?: boolean, socket: any }) {
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderContent = (signal: Signal) => {
    if (signal.isLocked) return (
      <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
        <Lock size={12} />
        {signal.title}
      </div>
    );
    
    try {
      const parsed = JSON.parse(signal.content);
      if (parsed.insight) return parsed.insight;
      if (parsed.rationale) return parsed.rationale;
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return signal.content;
    }
  };

  const renderJsonBadge = (content: string) => {
    try {
      JSON.parse(content);
      return (
        <span className="text-[8px] font-mono bg-zinc-500/20 text-zinc-400 px-1.5 py-0.5 rounded-full uppercase font-bold border border-white/5 ml-2">JSON Verified</span>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="bg-[#151619] border border-white/5 rounded-xl flex flex-col h-full relative overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#151619]/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-zinc-500" />
          <h2 className="font-mono text-sm font-medium tracking-tight uppercase">Signal Feed</h2>
        </div>
        <div className="flex items-center gap-3">
          {isAnyAgentThinking && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Loader2 size={10} className="text-indigo-500 animate-spin" />
              <span className="text-[8px] font-mono text-indigo-500 uppercase font-bold">Agents Thinking</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Live</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        <AnimatePresence initial={false}>
          {signals.map((signal, index) => (
            <motion.div
              key={signal.id || index}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
            >
              <div
                className={cn(
                  "bg-black/20 border rounded-lg p-3 transition-all group cursor-pointer relative overflow-hidden",
                  index === 0 ? "border-indigo-500/30 bg-indigo-500/[0.02]" : "border-white/5 hover:border-white/10"
                )}
                onClick={() => setSelectedSignal(signal)}
                onMouseEnter={() => setHoveredSignal(signal.id)}
                onMouseLeave={() => setHoveredSignal(null)}
              >
                {index === 0 && (
                  <div className="absolute -top-2 -left-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center",
                      signal.type === 'ALPHA' ? "bg-indigo-500/10 text-indigo-500" :
                      signal.type === 'PREDICTION' ? "bg-amber-500/10 text-amber-500" :
                      signal.type === 'ALERT' ? "bg-rose-500/10 text-rose-500" :
                      signal.type === 'WHALE' ? "bg-blue-500/10 text-blue-500" :
                      signal.type === 'SKILL_EXECUTION' ? "bg-purple-500/10 text-purple-500" :
                      "bg-zinc-500/10 text-zinc-500"
                    )}>
                      {signal.type === 'ALPHA' ? <Zap size={14} /> : 
                       signal.type === 'PREDICTION' ? <TrendingUp size={14} /> : 
                       signal.type === 'ALERT' ? <AlertCircle size={14} /> : 
                       signal.type === 'WHALE' ? <TrendingUp size={14} /> : 
                       signal.type === 'SKILL_EXECUTION' ? <Activity size={14} /> :
                       <Globe size={14} />}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{signal.type}</span>
                    {signal.isLive ? (
                      <span className="text-[8px] font-mono bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded-full uppercase font-bold border border-indigo-500/30">Live</span>
                    ) : (
                      <span className="text-[8px] font-mono bg-zinc-500/10 text-zinc-500 px-1.5 py-0.5 rounded-full uppercase border border-white/5">Simulated</span>
                    )}
                    {signal.x402Status === 'PAID' && (
                      <span className="text-[8px] font-mono bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full uppercase border border-blue-500/30">X402 Paid</span>
                    )}
                    {renderJsonBadge(signal.content)}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 uppercase">
                    {mounted ? new Date(signal.timestamp).toLocaleTimeString() : '--:--:--'}
                  </span>
                </div>

                <div className="text-xs font-mono text-zinc-300 leading-relaxed mb-3 overflow-hidden">
                  {renderContent(signal)}
                  {!signal.isLocked && signal.content.startsWith('{') && (
                    <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[10px] text-zinc-500 font-mono whitespace-pre-wrap break-all">
                      {signal.content}
                    </div>
                  )}
                </div>

                {signal.recommendation && (
                  <div className="mb-3 p-2 bg-white/[0.02] border border-white/5 rounded flex items-center gap-2">
                    <TrendingUp size={12} className={signal.recommendation.color} />
                    <span className={cn("text-[10px] font-mono font-bold uppercase", signal.recommendation.color)}>
                      {signal.recommendation.label}
                    </span>
                  </div>
                )}

                {signal.type === 'SKILL_EXECUTION' && signal.skillDetails && (
                  <div className="mb-3 p-2 bg-purple-500/5 border border-purple-500/10 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-purple-400">Bankr Skill Executed</span>
                      <span className="text-[10px] font-mono text-purple-500/70">{signal.skillDetails.type}</span>
                    </div>
                    <div className="text-[10px] font-mono text-white flex items-center gap-2">
                      <span className="text-purple-400">{signal.skillDetails.amount}</span>
                      <span className="text-zinc-500">{signal.skillDetails.from}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-purple-400">{signal.skillDetails.to}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">Confidence:</span>
                      <span className={cn(
                        "text-[10px] font-mono",
                        signal.confidence > 0.9 ? "text-emerald-500" : "text-white"
                      )}>{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">Source:</span>
                      <span className="text-[10px] text-white font-mono">{signal.source}</span>
                    </div>
                  </div>
                  <div className="text-zinc-500 group-hover:text-white transition-colors">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {hoveredSignal === signal.id && signal.author && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-50 bg-[#1A1B1E]/95 border border-emerald-500/30 rounded-lg p-3 shadow-2xl pointer-events-none flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white leading-none">{signal.author}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{signal.handle}</p>
                        </div>
                        <div className="ml-auto">
                          <Globe size={12} className="text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono leading-relaxed italic">
                        "{signal.content.length > 80 ? signal.content.substring(0, 80) + '...' : signal.content}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-zinc-600 uppercase">Verified Source</span>
                      <span className="text-[8px] font-mono text-emerald-500 uppercase">Click to view on {signal.source}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#151619] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-mono font-bold text-white mb-6">{selectedSignal.type} Signal</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Confidence</p>
                    <p className="text-xl font-mono text-emerald-500">{(selectedSignal.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Action</p>
                    <p className="text-xl font-mono text-white">{selectedSignal.action || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono mb-2">Summary</p>
                  <p className="text-sm text-zinc-300 font-mono leading-relaxed">{selectedSignal.content}</p>
                </div>

                {selectedSignal.divergence && (
                  <div className="bg-black/20 p-4 rounded-lg border border-indigo-500/20">
                    <p className="text-[10px] text-indigo-500 uppercase font-mono mb-2">Market Divergence</p>
                    <p className="text-sm text-white font-mono leading-relaxed">{selectedSignal.divergence}</p>
                  </div>
                )}
              </div>

              {selectedSignal.x402Status === 'PAID' && (
                <button
                  onClick={() => {
                    socket.emit('execute-trade', { 
                      signalId: selectedSignal.id, 
                      marketId: selectedSignal.url,
                      amount: "1.0"
                    });
                    toast.info("Trade Submitted", { description: "Waiting for execution..." });
                    setSelectedSignal(null);
                  }}
                  className="mt-8 w-full bg-emerald-500 text-black font-bold py-3 rounded-lg text-sm font-mono uppercase hover:bg-emerald-400 transition-colors"
                >
                  Approve & Execute Trade
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
