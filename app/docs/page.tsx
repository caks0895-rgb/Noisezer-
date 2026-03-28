import { readFile } from 'fs/promises';
import path from 'path';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default async function DocsPage() {
  const filePath = path.join(process.cwd(), 'docs', 'api.md');
  const content = await readFile(filePath, 'utf8');

  return (
    <main className="container mx-auto py-10 px-4 bg-black min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">Noisezer API Documentation</h1>
      <MarkdownRenderer content={content} />
    </main>
  );
}
