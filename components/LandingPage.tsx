'use client';

import { motion } from 'motion/react';
import Logo from './Logo';
import { ArrowRight, Zap, ShieldCheck, BarChart3, Database, Github, Newspaper, BrainCircuit, FileText, Bot, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const FAQ = [
  { q: "What is Noisezer?", a: "Noisezer is a DaaS platform for AI agents, filtering Web3 noise into high-fidelity signals." },
  { q: "How does X402 work?", a: "X402 enables autonomous micropayments, allowing agents to pay for data per-request without manual auth." },
  { q: "Is this financial advice?", a: "No. Noisezer provides data for informational purposes only. Always conduct your own due diligence." },
  { q: "How do I integrate my agent?", a: "Connect via WebSocket for real-time signals or use our API endpoints. See the /docs page for details." }
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [activeTab, setActiveTab] = useState('human');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        <div className="bg-[#151619] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-mono font-bold text-indigo-500 mb-4">WHY NOISEZER?</h2>
          <p className="text-zinc-400 font-mono text-sm leading-relaxed">
            In a sea of Web3 noise, Noisezer provides high-fidelity, machine-readable data fusion. 
            We eliminate spam and shilling, delivering only verified signals for your autonomous agents.
          </p>
        </div>
        <div className="bg-[#151619] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-mono font-bold text-indigo-500 mb-4">WHAT WE PROVIDE</h2>
          <p className="text-zinc-400 font-mono text-sm leading-relaxed">
            Normalized 0.0-1.0 Intelligence Scores, real-time on-chain anomaly detection, 
            GitHub builder scouting, and cross-platform sentiment analysis.
          </p>
        </div>
        <div className="bg-[#151619] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl font-mono font-bold text-indigo-500 mb-4">HOW IT WORKS</h2>
          <p className="text-zinc-400 font-mono text-sm leading-relaxed">
            Our consensus engine fuses five distinct data sources, verifies them against on-chain activity, 
            and analyzes them through specialized LLM agents before pushing to your feed.
          </p>
        </div>
      </div>

      {/* Documentation Tabs */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="flex border-b border-white/10 mb-8">
          {['human', 'agent'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-mono text-sm uppercase ${activeTab === tab ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500'}`}
            >
              {tab === 'human' ? <User className="inline mr-2" size={16}/> : <Bot className="inline mr-2" size={16}/>}
              {tab} Docs
            </button>
          ))}
        </div>
        <div className="bg-[#151619] p-8 rounded-2xl border border-white/5">
          {activeTab === 'human' ? (
            <div className="space-y-4 text-zinc-400 font-mono text-sm">
              <h3 className="text-white font-bold">For Human Customers</h3>
              <p>Use Noisezer to monitor market trends, scout new builders, and analyze on-chain anomalies.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Monitor the Live Insights feed for verified signals.</li>
                <li>Use the Chat interface to ask Noisezer for deep analysis on specific tokens.</li>
                <li>Review the API Usage tab to monitor your X402 consumption.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 text-zinc-400 font-mono text-sm">
              <h3 className="text-white font-bold">For AI Agents</h3>
              <p>Noisezer provides a machine-readable API for autonomous agents.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Connect via WebSocket to receive real-time `signal-updates`.</li>
                <li>Use the provided API endpoints for structured data queries.</li>
                <li>Ensure your agent holds sufficient X402 for API access.</li>
              </ul>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-white/5 flex gap-4">
            <a href="/docs" className="text-indigo-500 font-mono text-xs hover:underline">View Full Documentation</a>
            <a href="/terms" className="text-zinc-500 font-mono text-xs hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl font-mono font-bold text-white mb-8 text-center">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-[#151619] border border-white/5 rounded-xl">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-6 flex justify-between items-center text-left"
              >
                <span className="font-mono text-sm text-white">{item.q}</span>
                <ChevronDown className={cn("transition-transform", openFaq === i ? "rotate-180" : "")} size={18}/>
              </button>
              {openFaq === i && (
                <div className="p-6 pt-0 font-mono text-xs text-zinc-400 border-t border-white/5">{item.a}</div>
              )}
            </div>
          ))}
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
