import { getRecentBaseActivity } from './blockchain';
import { requestLLM, MACHINE_SYSTEM_PROMPT } from './gemini-server';

// Simple Cache for Discovery
const discoveryCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1800000; // 30 minutes

/**
 * Verifikasi apakah narasi berita didukung oleh aktivitas on-chain (volume).
 */
function verifyOnChainActivity(rawData: any) {
  // Logic: Check if any token mentioned in news has high volume in DexScreener (> $10k)
  const highVolumeTokens = rawData.dex
    .filter((pair: any) => pair.volume24h > 10000)
    .map((pair: any) => pair.baseToken.address);

  // Check if any news mentions these tokens (simplified)
  const matches = rawData.news.some((news: any) => 
    highVolumeTokens.some((addr: string) => news.title.includes(addr) || news.summary.includes(addr))
  );

  return {
    narrative_matches_onchain: matches,
    risk_level: matches ? 'LOW' : 'MEDIUM', // Narrative matches = lower risk
    confidence: matches ? 0.9 : 0.4
  };
}

export async function getBaseAlphaInsights() {
  const cacheKey = 'base_alpha_insights';
  const cached = discoveryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // 1. Fetch DexScreener Data (New Pairs on Base)
    const dexResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/base');
    const dexData = dexResponse.ok ? await dexResponse.json() : { pairs: [] };

    // 2. Fetch RSS News (Example: CryptoPanic - using public feed without token for now)
    const rssResponse = await fetch('https://cryptopanic.com/api/v1/posts/?public=true');
    const rssData = rssResponse.ok ? await rssResponse.json() : { results: [] };

    // 3. GitHub Activity (Placeholder for Base-related repos)
    const ghResponse = await fetch('https://api.github.com/repos/base-org/node/commits?per_page=5');
    const ghData = ghResponse.ok ? await ghResponse.json() : [];

    // 4. On-chain Activity
    const onChainData = await getRecentBaseActivity();

    // 5. Polymarket Order Book (Placeholder for BTC prediction market)
    const polymarketData = await getPolymarketOrderBook('21033'); // Placeholder ID

    // Combine and Analyze (This will be passed to Gemini)
    const rawData = {
      dex: dexData.pairs?.slice(0, 5) || [],
      news: rssData.results?.slice(0, 5) || [],
      github: Array.isArray(ghData) ? ghData.slice(0, 3) : [],
      onChain: onChainData,
      polymarket: polymarketData
    };

    // Perform Verification
    const verification = verifyOnChainActivity(rawData);

    // Note: Analysis happens in gemini.ts
    const result = {
      rawData,
      verification,
      timestamp: Date.now()
    };

    discoveryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Discovery failed:', error);
    return { rawData: null, verification: { narrative_matches_onchain: false, risk_level: 'HIGH', confidence: 0 }, timestamp: Date.now() };
  }
}

/**
 * Get Polymarket Order Book for a specific market
 */
export async function getPolymarketOrderBook(marketId: string) {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/orderbook?marketId=${marketId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching Polymarket order book:', error);
    return null;
  }
}

// --- GITHUB SCOUT ---

async function searchGitHubRepos(query: string) {
  const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=5`);
  const data = await response.json();
  return data.items || [];
}

async function fetchReadme(repoFullName: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/readme`, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });
    return await response.text();
  } catch {
    return "";
  }
}

async function analyzeGitHubRepo(repo: any): Promise<{ score: number, reason: string }> {
  const readme = await fetchReadme(repo.full_name);
  const prompt = `
    Analisis repo GitHub ini sebagai analis teknis untuk ekosistem Base Chain.
    Repo: ${repo.full_name}
    Description: ${repo.description}
    README: ${readme.substring(0, 2000)}
    
    Berikan skor 0-100 berdasarkan:
    - Kedalaman teknis (ada struktur aplikasi, dependensi relevan, test)
    - Utilitas (memecahkan masalah di Base)
    - Orisinalitas (bukan tutorial boilerplate)
    
    Output JSON: { "score": number, "reason": string }
  `;
  
  try {
    const analysis = await requestLLM(prompt, 'gemini-3-flash', 0, MACHINE_SYSTEM_PROMPT);
    const cleanedContent = analysis.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch {
    return { score: 0, reason: 'Analysis failed' };
  }
}

export async function discoverNewBaseBuilders() {
  const repos = await searchGitHubRepos('topic:base created:>2026-03-20');
  
  const alphaBuilders = [];
  for (const repo of repos) {
    const analysis = await analyzeGitHubRepo(repo);
    
    if (analysis.score > 60) {
      const status = analysis.score > 80 ? 'VERIFIED' : 'NOT_VERIFIED';
      alphaBuilders.push({ 
        id: `gh-${repo.id}`,
        type: 'GITHUB_ALPHA',
        source: 'GitHub Scout',
        author: repo.owner.login,
        content: `[${status}] ${repo.full_name}: ${analysis.reason}`,
        confidence: analysis.score / 100,
        timestamp: Date.now(),
        url: repo.html_url,
        x402Status: 'FREE',
        isLive: true,
        status: status
      });
    }
  }
  return alphaBuilders;
}
