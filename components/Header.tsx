'use client';

import { Terminal, Shield, Activity, Database, Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-neutral-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold mono tracking-tighter uppercase leading-none">Noisezer</h1>
            <p className="text-[10px] text-emerald-500 mono font-bold uppercase tracking-widest">Signal-to-Noise Engine</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Feed', icon: Activity },
            { label: 'Agents', icon: Cpu },
            { label: 'Database', icon: Database },
            { label: 'Security', icon: Shield },
          ].map((item) => (
            <button key={item.label} className="flex items-center gap-2 text-xs mono text-neutral-400 hover:text-emerald-400 transition-colors uppercase font-bold">
              <item.icon className="w-3 h-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-neutral-500 mono uppercase">Network Status</span>
            <span className="text-[10px] text-emerald-500 mono font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Base Mainnet
            </span>
          </div>
          <button className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold mono rounded hover:bg-emerald-400 transition-all uppercase">
            Connect Agent
          </button>
        </div>
      </div>
    </header>
  );
}
