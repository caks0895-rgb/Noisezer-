'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getAgentMemory, saveAgentMemory } from '../lib/memory';
import { IMMUTABLE_SYSTEM_PROMPT } from '../lib/gemini-server';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export default function NoisezerChat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

      // Construct prompt with history
      const historyContext = messages.map(h => `${h.role}: ${h.content}`).join('\n');
      const prompt = `
        ${IMMUTABLE_SYSTEM_PROMPT}

        Conversation History:
        ${historyContext}
        user: ${userMessage.content}
      `;

      // Call Gemini directly
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });

      const assistantMessage = { role: 'assistant' as const, content: response.text || 'No response' };
      
      // Save assistant message
      await saveAgentMemory(chatId, 'assistant', assistantMessage.content);
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
            {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded p-2"
          placeholder="Tanya Noisezer..."
        />
        <button onClick={sendMessage} disabled={isLoading} className="bg-blue-500 text-white p-2 rounded">
          {isLoading ? '...' : 'Kirim'}
        </button>
      </div>
    </div>
  );
}
