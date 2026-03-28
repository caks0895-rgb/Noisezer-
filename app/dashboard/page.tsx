'use client';

import { useState } from 'react';

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    chain: 'base',
    minLiquidity: 50000,
    maxRisk: 'MEDIUM',
    categories: ['ALPHA', 'NEWS']
  });

  const jsonRequest = {
    chain: filters.chain,
    filters: {
      min_liquidity_usd: filters.minLiquidity,
      max_risk_level: filters.maxRisk,
      categories: filters.categories
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-6 font-mono">NOISEZER_TERMINAL_v1.0</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Kiri: Filter Builder */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold mb-4 font-mono text-blue-400">FILTER_BUILDER</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CHAIN</label>
              <input 
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm font-mono"
                value={filters.chain}
                onChange={(e) => setFilters({...filters, chain: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">MIN_LIQUIDITY_USD</label>
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm font-mono"
                value={filters.minLiquidity}
                onChange={(e) => setFilters({...filters, minLiquidity: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-xs font-mono text-slate-400 mb-2">JSON_PREVIEW</h3>
            <pre className="bg-slate-950 p-4 rounded border border-slate-700 text-xs font-mono text-green-400 overflow-x-auto">
              {JSON.stringify(jsonRequest, null, 2)}
            </pre>
          </div>
        </div>

        {/* Panel Kanan: Intelligence Feed */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold mb-4 font-mono text-blue-400">INTELLIGENCE_FEED</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-500 font-mono text-sm">
            AWAITING_DATA_STREAM...
          </div>
        </div>
      </div>
    </div>
  );
}
