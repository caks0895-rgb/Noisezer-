'use client';

import { motion } from 'motion/react';
import { NoisezerLogo } from './Logo';
import { ArrowRight, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex justify-center mb-6">
          <NoisezerLogo className="w-20 h-20" />
        </div>
        <h1 className="text-6xl font-mono font-bold tracking-tighter mb-4">NOISEZER</h1>
        <p className="text-zinc-500 font-mono text-lg max-w-md mx-auto">
          Filter the noise. Capture the Alpha. Autonomous financial intelligence for the Base Chain.
        </p>
      </motion.div>

      {/* Infographic Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
        {[
          { icon: Zap, title: "Alpha Filtering", desc: "Real-time AI analysis of X and RSS feeds." },
          { icon: ShieldCheck, title: "Smart Money", desc: "Track new contracts with locked liquidity." },
          { icon: BarChart3, title: "Prediction Markets", desc: "Polymarket data analysis for high-volume opportunities." }
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-[#151619] border border-white/5 p-6 rounded-2xl shadow-2xl"
          >
            <item.icon className="text-indigo-500 mb-4" size={24} />
            <h3 className="font-mono font-bold mb-2">{item.title}</h3>
            <p className="text-zinc-500 font-mono text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEnter}
        className="flex items-center gap-2 bg-indigo-500 text-white px-8 py-4 rounded-full font-mono font-bold hover:bg-indigo-400 transition-colors"
      >
        ENTER TERMINAL <ArrowRight size={18} />
      </motion.button>
    </div>
  );
}
