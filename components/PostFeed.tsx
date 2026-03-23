'use client';

import { useState, useMemo } from 'react';
import { Post, PostAnalysis } from '@/lib/gemini';
import { Search, Filter, Zap, ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Vitalik Buterin',
    handle: '@VitalikButerin',
    content: 'The future of L2 scaling depends on efficient data availability layers. Base is showing great progress in decentralizing its sequencer.',
    url: 'https://x.com/VitalikButerin/status/123456789',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    analysis: {
      score: 95,
      summary: 'Vitalik discusses Base L2 scaling and decentralization.',
      category: 'TECHNICAL',
      isNoise: false
    }
  },
  {
    id: '2',
    author: 'MoonBoy 🚀',
    handle: '@moon_shill_99',
    content: 'BUY $DOGE_ELON_PEPE NOW!!! 1000x incoming! Don\'t miss the rocket! 🚀🚀🚀 #crypto #gem',
    url: 'https://x.com/moon_shill_99/status/987654321',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    analysis: {
      score: 5,
      summary: 'Obvious low-quality memecoin shilling.',
      category: 'SHILL',
      isNoise: true
    }
  },
  {
    id: '3',
    author: 'Base Dev',
    handle: '@base_builder',
    content: 'New tutorial: How to deploy a gasless paymaster on Base using Account Abstraction. Check the repo below.',
    url: 'https://x.com/base_builder/status/456789123',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    analysis: {
      score: 90,
      summary: 'Technical guide for account abstraction on Base.',
      category: 'TECHNICAL',
      isNoise: false
    }
  },
  {
    id: '4',
    author: 'News Bot',
    handle: '@crypto_news_bot',
    content: 'Bitcoin price is currently $98,452. Up 0.5% in the last hour. Volume is steady.',
    url: 'https://x.com/crypto_news_bot/status/321654987',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    analysis: {
      score: 60,
      summary: 'Standard price update for BTC.',
      category: 'NEWS',
      isNoise: false
    }
  }
];

export default function PostFeed({ searchQuery }: { searchQuery?: string }) {
  const [hideNoise, setHideNoise] = useState(true);

  const { data: posts = MOCK_POSTS, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['posts-analysis', searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        const response = await fetch('/api/search', {
          method: 'POST',
          body: JSON.stringify({ query: searchQuery }),
        });
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
      }
      return MOCK_POSTS;
    },
    initialData: searchQuery ? [] : MOCK_POSTS,
  });

  const filteredPosts = useMemo(() => {
    return hideNoise 
      ? posts.filter((p: Post) => !p.analysis?.isNoise)
      : posts;
  }, [posts, hideNoise]);

  const loading = isLoading || isFetching;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mono tracking-tighter uppercase">Signal Feed</h2>
            <p className="text-xs text-neutral-500 mono">Filtering noise for AI Agents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setHideNoise(!hideNoise)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs mono transition-all ${
              hideNoise 
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <Filter className="w-3 h-3" />
            {hideNoise ? 'NOISE FILTER: ON' : 'NOISE FILTER: OFF'}
          </button>
          
          <button 
            onClick={() => refetch()}
            disabled={loading}
            className="p-1.5 bg-neutral-900 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post: Post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 border rounded-lg transition-all ${
                post.analysis?.isNoise 
                  ? 'border-red-900/30 bg-red-950/5 opacity-60' 
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mono text-neutral-400 font-bold">
                    {post.author[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{post.author}</h3>
                    <p className="text-xs text-neutral-500 mono">{post.handle}</p>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-600 mono">
                  {formatDistanceToNow(post.timestamp)} ago
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4 text-neutral-200">
                {post.content}
              </p>

              {post.analysis && (
                <div className="mt-4 pt-4 border-t border-neutral-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded mono font-bold ${
                        post.analysis.isNoise ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {post.analysis.category}
                      </span>
                      <span className="text-[10px] text-neutral-500 mono uppercase">
                        Signal Score: {post.analysis.score}%
                      </span>
                    </div>
                    {post.analysis.isNoise && (
                      <div className="flex items-center gap-1 text-red-400 text-[10px] mono">
                        <ShieldAlert className="w-3 h-3" />
                        NOISE DETECTED
                      </div>
                    )}
                  </div>
                  
                  <div className="signal-bar mb-3">
                    <div 
                      className="signal-fill" 
                      style={{ 
                        width: `${post.analysis.score}%`,
                        backgroundColor: post.analysis.isNoise ? '#ff4100' : '#00ff41'
                      }} 
                    />
                  </div>
                  
                  <p className="text-xs italic text-neutral-400">
                    &ldquo; {post.analysis.summary} &rdquo;
                  </p>
                </div>
              )}
              
              <div className="mt-4 flex justify-end gap-2">
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[10px] mono text-neutral-300 rounded transition-all uppercase font-bold"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Evidence
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
