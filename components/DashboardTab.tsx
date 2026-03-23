import { AgentCard } from './AgentCard';
import { StatsOverview } from './StatsOverview';
import { Activity, DollarSign } from 'lucide-react';
import { getEconomicSummary } from '@/lib/economic-engine';
import { cn } from '@/lib/utils';

export function DashboardTab({ agents, insights, stats }: { agents: any[], insights: any, stats: any[] }) {
  const econ = getEconomicSummary();
  return (
    <div className="space-y-6">
      <StatsOverview stats={stats} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151619] border border-white/5 rounded-xl p-6 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-indigo-500" />
            <h2 className="font-mono text-sm font-medium tracking-tight uppercase">Profitability</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">Costs</p>
              <p className="text-lg font-mono text-white">${econ.totalApiCosts.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">Revenue</p>
              <p className="text-lg font-mono text-indigo-500">${econ.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-500 font-mono uppercase">Net Profit</p>
            <p className={cn("text-2xl font-mono font-bold", econ.profit >= 0 ? "text-indigo-500" : "text-rose-500")}>
              ${econ.profit.toFixed(4)}
            </p>
          </div>
        </div>

        {insights && (
          <div className="bg-[#151619] border border-white/5 rounded-xl p-6 col-span-2">
            <h2 className="text-xl font-mono font-medium tracking-tight uppercase mb-4">Base Alpha Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-300 font-mono leading-relaxed">{insights.summary}</p>
                <div className="mt-4">
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Key Opportunities</h4>
                  <ul className="list-disc list-inside text-xs text-zinc-400 font-mono space-y-1">
                    {insights.keyOpportunities.map((op: string, i: number) => <li key={i}>{op}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center border-l border-white/5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Alpha Score</span>
                <span className="text-4xl font-mono font-bold text-indigo-500">{insights.alphaScore}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded mt-2 bg-indigo-500/20 text-indigo-500">{insights.riskLevel} Risk</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-zinc-500" />
            <h2 className="font-mono text-sm font-medium tracking-tight uppercase">Active Agents</h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{agents.length} AGENTS RUNNING</span>
        </div>
        {agents.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 font-mono text-xs">No agents currently active.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
