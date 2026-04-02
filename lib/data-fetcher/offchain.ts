import Parser from 'rss-parser';
import { OffChainData } from './types';
import { getSentimentAnalysis } from '../gemini-server';

const parser = new Parser();

export async function getOffChainData(ca: string): Promise<OffChainData | null> {
  try {
    // Fetch RSS for mentions
    const feed = await parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss/');
    
    // Use Gemini for real sentiment and narrative analysis
    const sentiment = await getSentimentAnalysis(ca);
    
    return {
      sentimentScore: sentiment.score || 0.5,
      mentions: feed.items?.length || 0,
      narrativeStrength: sentiment.narrativeStrength || 0.5,
      sources: ['Coindesk', 'Gemini AI Analysis'],
    };
  } catch (error) {
    console.error('Error fetching off-chain data:', error);
    return null;
  }
}
