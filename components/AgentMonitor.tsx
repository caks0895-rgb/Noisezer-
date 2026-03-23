'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Cpu, Wifi, WifiOff, Terminal, Zap, X, History, BarChart3, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface AgentHistory {
  time: number;
  usage: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  task: string;
  usage: number;
  status: 'online' | 'idle' | 'reconnecting';
  history: AgentHistory[];
  uptime: string;
  lastSeen: string;
}

export default function AgentMonitor() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('agent-updates', (updatedAgents: Agent[]) => {
      setAgents(updatedAgents);
      // Update selected agent if it's open to keep data fresh
      if (selectedAgent) {
        const updated = updatedAgents.find(a => a.id === selectedAgent.id);
        if (updated) setSelectedAgent(updated);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedAgent]);

  return (
    <div className="max-w-4xl mx-auto p-4 mb-12">
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${connected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Activity className={`w-5 h-5 ${connected ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold mono uppercase tracking-wider">Live Agent Monitor</h3>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-neutral-500 mono uppercase">
                  {connected ? 'System Online' : 'System Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] mono text-neutral-500">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Network Load: {agents.reduce((acc, a) => acc + a.usage, 0)} req/m</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedAgent(agent)}
                className="p-4 bg-black/40 border border-neutral-800 rounded-lg hover:border-emerald-500/30 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-neutral-800 rounded group-hover:bg-emerald-500/10 transition-colors">
                      <Terminal className="w-3 h-3 text-neutral-400 group-hover:text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold mono uppercase block">{agent.name}</span>
                      <span className="text-[9px] text-neutral-500 mono uppercase">{agent.role}</span>
                    </div>
                  </div>
                  {agent.status === 'online' ? (
                    <Wifi className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500 animate-pulse" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[9px] text-neutral-600 mono uppercase mb-1">Current Task</div>
                    <div className="text-[11px] text-neutral-300 mono truncate bg-neutral-800/50 px-2 py-1 rounded">
                      {agent.task}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mono text-neutral-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {agent.usage} req/m
                    </span>
                    <span className="text-emerald-500/70">Details →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Terminal className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mono uppercase tracking-tighter">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 mono uppercase">{selectedAgent.role}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-700" />
                      <span className="text-[10px] text-emerald-500 mono uppercase font-bold">{selectedAgent.status}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-black/40 border border-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[10px] mono uppercase">Uptime</span>
                    </div>
                    <div className="text-xl font-bold mono text-emerald-400">{selectedAgent.uptime}</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                      <Activity className="w-3 h-3" />
                      <span className="text-[10px] mono uppercase">Current Load</span>
                    </div>
                    <div className="text-xl font-bold mono">{selectedAgent.usage} <span className="text-[10px] text-neutral-500">req/m</span></div>
                  </div>
                  <div className="p-4 bg-black/40 border border-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] mono uppercase">Last Seen</span>
                    </div>
                    <div className="text-[11px] font-bold mono truncate">
                      {new Date(selectedAgent.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold mono uppercase">Performance History</h4>
                    </div>
                    <span className="text-[10px] text-neutral-500 mono uppercase">Real-time API Throughput</span>
                  </div>
                  <div className="h-48 w-full bg-black/40 border border-neutral-800 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedAgent.history}>
                        <defs>
                          <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis hide dataKey="time" />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="usage" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorUsage)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Connection History / Activity Log */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold mono uppercase">Recent Activity Log</h4>
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: '14:30:12', event: 'Task Switched', detail: selectedAgent.task },
                      { time: '14:28:45', event: 'Connection Stabilized', detail: 'Latency 12ms' },
                      { time: '14:25:00', event: 'API Key Rotated', detail: 'Success' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-neutral-800/50 rounded-lg text-[10px] mono">
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-600">{log.time}</span>
                          <span className="text-emerald-500/80 font-bold uppercase">{log.event}</span>
                        </div>
                        <span className="text-neutral-400 italic">{log.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs mono font-bold rounded transition-colors uppercase"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
