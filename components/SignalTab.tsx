import { SignalFeed } from './SignalFeed';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SignalTab({ signals, isAnyAgentThinking }: { signals: any[], isAnyAgentThinking: boolean }) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [source, setSource] = useState<string>('ALL');

  const filteredSignals = Array.isArray(signals) ? signals.filter(s => {
    const typeMatch = filterType === 'ALL' || s.type === filterType;
    const confidenceMatch = s.confidence >= minConfidence;
    const sourceMatch = source === 'ALL' || s.source === source;
    return typeMatch && confidenceMatch && sourceMatch;
  }) : [];

  return (
    <div className="h-full">
      <div className="min-h-[400px]">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 font-mono text-xs">No signals matching filters.</div>
        ) : (
          <SignalFeed signals={filteredSignals} isAnyAgentThinking={isAnyAgentThinking} />
        )}
      </div>
    </div>
  );
}
