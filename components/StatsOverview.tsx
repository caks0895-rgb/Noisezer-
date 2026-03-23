'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Activity, Database, ShieldCheck, DollarSign } from 'lucide-react';

export function StatsOverview({ stats }: { stats: { label: string; value: string; icon: React.ReactElement; color: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#151619] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors"
        >
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-1 tracking-widest">{stat.label}</p>
            <h3 className="text-xl font-mono font-medium text-white">{stat.value}</h3>
          </div>
          <div className={`${stat.color} bg-black/20 p-2 rounded-lg border border-white/5`}>
            {stat.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
