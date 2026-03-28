'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getAgentMemory, saveAgentMemory } from '../lib/memory';
import { HUMAN_SYSTEM_PROMPT } from '../lib/gemini-server';
import { getTokenInfo } from '../lib/blockchain';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export default function NoisezerChat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Gemini API Key:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Set' : 'Not Set');
    async function loadMemory() {
      const memory = await getAgentMemory(chatId);
      setMessages(memory.history);
    }
    loadMemory();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      await saveAgentMemory(chatId, 'user', userMessage.content);

      // 1. Extract CA if present in query
      const caMatch = input.match(/0x[a-fA-F0-9]{40}/);
      let onChainInfo: any = null;

      if (caMatch) {
        const ca = caMatch[0] as `0x${string}`;
        console.log(`[PRE-FETCH] Fetching on-chain data for ${ca}...`);
        onChainInfo = await getTokenInfo(ca);
      }

      // 2. Construct prompt with on-chain context if available
      const onChainContext = onChainInfo?.success 
        ? `On-Chain Data: ${JSON.stringify(onChainInfo)}` 
        : "No verified on-chain data available.";

      // Construct prompt with history
      const historyContext = messages.map(h => `${h.role}: ${h.content}`).join('\n');
      const prompt = `
        Conversation History:
        ${historyContext}
        user: ${userMessage.content}
        ${onChainContext}
      `;

      // Call Gemini directly
      console.log('Sending prompt to Gemini...');
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: {
          systemInstruction: HUMAN_SYSTEM_PROMPT,
        }
      });
      console.log('Gemini response received:', response);

      const assistantMessage = { role: 'assistant' as const, content: response.text || 'No response' };
      
      // Save assistant message
      await saveAgentMemory(chatId, 'assistant', assistantMessage.content);
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Detailed Error in sendMessage:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: Failed to get response. Details: ${error instanceof Error ? error.message : String(error)}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed break-words ${m.role === 'user' ? 'bg-blue-200 !text-slate-900 ml-auto max-w-[85%]' : 'bg-slate-200 !text-slate-900 mr-auto max-w-[85%]'}`}>
            <div className="markdown-body">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded-full px-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ask Noisezer..."
        />
        <button onClick={sendMessage} disabled={isLoading} className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-colors">
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
