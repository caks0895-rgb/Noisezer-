'use client';
import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
