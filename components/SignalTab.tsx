import { SignalFeed } from './SignalFeed';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SignalTab({ signals, isAnyAgentThinking, socket }: { signals: any[], isAnyAgentThinking: boolean, socket: any }) {
  const [query, setQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [source, setSource] = useState<string>('ALL');

  const handleRequestSignal = () => {
    if (!socket || !query.trim()) return;
    socket.emit('request-signal', { query, filters: [filterType] });
    setQuery('');
  };

  const filteredSignals = signals.filter(s => {
    const typeMatch = filterType === 'ALL' || s.type === filterType;
    const confidenceMatch = s.confidence >= minConfidence;
    const sourceMatch = source === 'ALL' || s.source === source;
    return typeMatch && confidenceMatch && sourceMatch;
  });

  const sources = Array.from(new Set(signals.map(s => s.source).filter(s => s)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      <div className="lg:col-span-1 bg-[#151619] border border-white/5 rounded-xl p-4">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Noisezer Request</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter query..."
            className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs font-mono text-white placeholder:text-zinc-600"
          />
          <div>
            <label className="text-[10px] font-mono text-zinc-600 uppercase mb-2 block">Filters</label>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'ALPHA', 'PREDICTION', 'ALERT', 'WHALE'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-mono uppercase transition-colors",
                        filterType === type 
                          ? "bg-indigo-500/20 text-indigo-500 border border-indigo-500/20" 
                          : "bg-black/20 text-zinc-500 border border-white/5 hover:border-white/10"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-1">Source</label>
                <select 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs font-mono text-white"
                >
                  <option key="ALL" value="ALL">All Sources</option>
                  {sources.map(src => <option key={src} value={src}>{src}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] text-zinc-500 uppercase block">Min Confidence</label>
                  <span className="text-[10px] font-mono text-white">{(minConfidence * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleRequestSignal}
            className="w-full bg-indigo-500 text-white text-[10px] font-mono uppercase py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            Request Signal
          </button>
        </div>
      </div>
      <div className="lg:col-span-3 min-h-[400px]">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 font-mono text-xs">No signals matching filters.</div>
        ) : (
          <SignalFeed signals={filteredSignals} isAnyAgentThinking={isAnyAgentThinking} socket={socket} />
        )}
      </div>
    </div>
  );
}
