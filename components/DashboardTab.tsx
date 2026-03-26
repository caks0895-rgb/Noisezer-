import { Activity, BrainCircuit } from 'lucide-react';

export function DashboardTab({ agents, insights, stats }: { agents: any[], insights: any, stats: any[] }) {
  return (
    <div className="space-y-8">
      {/* Minimalist Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#151619] border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              {stat.icon}
              <span className="text-[10px] font-mono uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-xl font-mono font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
      
      {/* Consensus Insight - Clean View */}
      {insights && (
        <div className="bg-[#151619] border border-white/5 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit size={18} className="text-indigo-500" />
            <h2 className="font-mono text-sm font-medium tracking-tight uppercase text-white">Consensus Engine Status</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <p className="text-sm text-zinc-400 font-mono leading-relaxed mb-4">{insights.summary}</p>
              <div className="flex gap-2">
                {insights.keyOpportunities?.map((op: string, i: number) => (
                  <span key={i} className="text-[10px] font-mono bg-white/5 text-zinc-300 px-2 py-1 rounded">
                    {op}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center border-l border-white/5 pl-8">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Consensus Score</span>
              <span className="text-5xl font-mono font-bold text-indigo-500">{insights.alphaScore}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded mt-2 bg-indigo-500/20 text-indigo-500">{insights.riskLevel} Risk</span>
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Agent List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-zinc-500" />
          <h2 className="font-mono text-sm font-medium tracking-tight uppercase text-white">Active Data Adapters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['On-Chain', 'News', 'Polymarket', 'Social', 'GitHub'].map((source) => (
            <div key={source} className="bg-[#151619] border border-white/5 rounded-lg p-4 flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">{source}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
