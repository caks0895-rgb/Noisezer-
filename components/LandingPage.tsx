'use client';

import { motion } from 'motion/react';
import Logo from './Logo';
import { ArrowRight, Zap, ShieldCheck, BarChart3, Database, Github, Newspaper, BrainCircuit } from 'lucide-react';

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-20"
      >
        <div className="flex justify-center mb-8">
          <Logo className="w-24 h-24" />
        </div>
        <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter mb-6">NOISEZER</h1>
        <p className="text-zinc-400 font-mono text-xl max-w-2xl mx-auto mb-10">
          Autonomous Data Provider for Web3 Intelligence. 
          We filter the noise. You build the intelligence.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="flex items-center gap-2 bg-indigo-500 text-white px-8 py-4 rounded-full font-mono font-bold hover:bg-indigo-400 transition-colors mx-auto"
        >
          ENTER DATA TERMINAL <ArrowRight size={18} />
        </motion.button>
      </motion.div>

      {/* Guide/Intro Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20">
        <div className="space-y-6">
          <h2 className="text-2xl font-mono font-bold text-indigo-500">WHAT IS NOISEZER?</h2>
          <p className="text-zinc-400 font-mono text-sm leading-relaxed">
            Noisezer is a Data-as-a-Service (DaaS) platform designed for autonomous agents. 
            We do not provide investment advice. 
            We provide high-fidelity, machine-readable data fusion to empower your own logic.
          </p>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-mono font-bold text-indigo-500">THE CONSENSUS ENGINE</h2>
          <p className="text-zinc-400 font-mono text-sm leading-relaxed">
            Our engine fuses five distinct data sources into a single, normalized 0.0-1.0 Intelligence Score.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Database, label: "On-Chain (50%)" },
              { icon: Newspaper, label: "News (20%)" },
              { icon: BarChart3, label: "Polymarket (15%)" },
              { icon: BrainCircuit, label: "Social (10%)" },
              { icon: Github, label: "GitHub (5%)" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#151619] p-3 rounded-lg border border-white/5">
                <item.icon size={16} className="text-indigo-500" />
                <span className="font-mono text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="max-w-4xl mx-auto bg-[#151619] border border-rose-900/30 p-8 rounded-2xl text-center">
        <ShieldCheck className="text-rose-500 mx-auto mb-4" size={32} />
        <h3 className="font-mono font-bold text-rose-500 mb-2">LEGAL DISCLAIMER</h3>
        <p className="text-zinc-400 font-mono text-xs">
          Noisezer provides market data and anomaly detection. We do NOT provide investment advice, 
          buy/sell recommendations, or price predictions. Users must make their own decisions 
          based on provided data. Noisezer is not liable for any outcomes.
        </p>
      </div>
    </div>
  );
}
