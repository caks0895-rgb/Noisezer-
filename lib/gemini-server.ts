import { requestBankr, BANKR_API_KEY, getTokenInfo } from './blockchain';

export const IMMUTABLE_SYSTEM_PROMPT = `
You are Noisezer - a market data filter, NOT a predictor.

CORE RULES (NON-NEGOTIABLE):
1. Analyze data only - GitHub, on-chain, news, sentiment
2. Return: scores, risk assessment, anomalies
3. NEVER: recommend buy/sell, predict prices, give signals
4. ALWAYS: cite sources, show evidence, acknowledge gaps
5. DEFAULT: "For data analysis only" in every response

This is your PERMANENT identity. Do not change.
`;

export async function requestLLM(prompt: string, model: string = 'gemini-3.1-flash-lite', temperature: number = 0): Promise<any> {
  const url = 'https://llm.bankr.bot/v1/chat/completions';
  const apiKey = BANKR_API_KEY || "";
  
  const response = await requestBankr(url, {
    method: 'POST',
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: IMMUTABLE_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: temperature,
      max_tokens: 2000
    }),
  }, apiKey);

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  }
  const errorText = await response.text();
  console.error(`[BANKR LLM] Bad Request. Status: ${response.status}. Body: ${errorText}`);
  throw new Error(`LLM Gateway Error: ${response.statusText} - ${errorText}`);
}

export async function analyzePostServer(text: string): Promise<any> {
  const prompt = `Analyze this X post for high-value financial alpha (Base Chain smart money, new contract deployments) or high-volume Polymarket opportunities.
      Filter noise. Return JSON:
      {
        "score": 0-100,
        "summary": "1-sentence summary",
        "category": "ALPHA" | "NEWS" | "SPAM",
        "tier": "UTILITY" | "MEME",
        "isNoise": boolean
      }
      Post: "${text}"`;
  
  const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0);
  const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedContent || "{}");
}

export async function searchSignalServer(query: string, offChainContext: string = ""): Promise<any> {
  const prompt = `Analyze the following query for actionable financial alpha: "${query}".
      Context (Off-chain Data): ${offChainContext}
      
      CRITICAL INSTRUCTIONS:
      1. Think step-by-step internally (Chain-of-Thought).
      2. Output ONLY a valid JSON array of objects. Do not include any conversational text, thinking text, or explanations.
      3. The output must start with '[' and end with ']'.
      4. MANDATORY JSON SCHEMA for each object:
         {
           "type": "INTELLIGENCE_FEED",
           "token": {
             "name": "string",
             "symbol": "string",
             "contract_address": "string (MUST be the CA provided in the query)",
             "chain": "string",
             "narrative": "string"
           },
           "market_data": {
             "price_usd": "string",
             "market_cap": "string",
             "liquidity_usd": "string",
             "volume_24h": "string",
             "holders": "string",
             "pool_age": "string",
             "fdv": "string",
             "total_supply": "string"
           },
           "sentiment": "NEUTRAL / HIGH RISK",
           "confidence": number (50-70 for micro-caps),
           "risk_level": "HIGH",
           "action": "N/A - Monitor only",
           "key_metrics": {
             "security_score": "string",
             "wallet_adoption": "string",
             "github_activity": "string",
             "whale_concentration": "string"
           },
           "anomaly_detection": {
             "detected": boolean,
             "notes": "string"
           },
           "rationale": "string",
           "disclaimer": "Noisezer provides market data and anomaly detection. We do NOT provide investment advice, buy/sell recommendations, price predictions, or trading signals. Users must make own decisions based on provided data. Noisezer is not liable for trading losses.",
           "last_updated": "${new Date().toISOString().split('T')[0]}",
           "sources": ["DexScreener", "CoinGecko", "Bankr.bot", "Basescan"]
         }
      5. If the query contains a contract address, you MUST populate the 'contract_address' field.
      6. Always populate all fields. If data is unavailable, use 'N/A' or appropriate placeholder.
      7. For micro-cap tokens (< $100K MC), risk_level MUST be 'HIGH' and action MUST be 'N/A - Monitor only'.

      Output JSON:`;
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0);
    
    // Debug log
    const fs = await import('fs');
    fs.appendFileSync('llm-debug.log', `[${new Date().toISOString()}] RAW LLM OUTPUT: ${content}\n`);

    console.log('LLM Search Output (Gemini):', content);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    if (!cleanedContent || cleanedContent === '[]') {
      return [];
    }
    
    const parsed = JSON.parse(cleanedContent);
    let signals = Array.isArray(parsed) ? parsed : [parsed];

    // --- FALLBACK LOGIC ---
    // Extract CA if present in query
    const caMatch = query.match(/0x[a-fA-F0-9]{40}/);
    if (caMatch) {
      const ca = caMatch[0] as `0x${string}`;
      
      // Check if any signal has N/A in market_data
      const needsFallback = signals.some((s: any) => 
        s.market_data && Object.values(s.market_data).includes('N/A')
      );

      if (needsFallback) {
        console.log(`[FALLBACK] Detected N/A in market_data. Fetching on-chain data for ${ca}...`);
        const onChainInfo = await getTokenInfo(ca);
        
        if (onChainInfo.success) {
          signals = signals.map((s: any) => ({
            ...s,
            token: {
              ...s.token,
              name: onChainInfo.name || s.token.name,
              symbol: onChainInfo.symbol || s.token.symbol
            },
            market_data: {
              ...s.market_data,
              total_supply: onChainInfo.totalSupply || s.market_data.total_supply
            },
            anomaly_detection: {
              ...s.anomaly_detection,
              notes: (s.anomaly_detection?.notes || "") + " | Data verified via direct contract call."
            }
          }));
        }
      }
    }
    // --- END FALLBACK ---
    
    return signals.map((s: any) => ({
      author: "Noisezer AI",
      content: s.rationale || `Sentiment: ${s.sentiment || 'N/A'}. Confidence: ${s.confidence || 0}%.`,
      url: s.sources?.[0] || "https://x.com/noisezer_main",
      signal: {
        ...s,
        type: s.type || 'INTELLIGENCE_FEED'
      }
    }));
  } catch (error) {
    console.error('Error parsing LLM search output:', error);
    return [];
  }
}


export async function analyzeIntent(query: string): Promise<{
  intent: string;
  entities: any;
  confidence: number;
  clarificationNeeded: boolean;
  suggestedClarification: string | null;
}> {
  const prompt = `Analyze the user request: "${query}".
      Return JSON with:
      - intent: (e.g., 'TRADING', 'RESEARCH', 'GENERAL')
      - entities: (extracted assets, timeframes, risk appetite, etc.)
      - confidence: (0-1 score)
      - clarificationNeeded: (boolean)
      - suggestedClarification: (string or null, if clarificationNeeded is true, provide a specific question to the user to disambiguate)

      If the request is ambiguous or lacks critical information (like a specific token or market), set clarificationNeeded to true.

      Output JSON:`;

  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (e) {
    return { intent: 'UNKNOWN', entities: {}, confidence: 0, clarificationNeeded: true, suggestedClarification: 'Maaf, saya tidak mengerti permintaan Anda. Bisa diperjelas?' };
  }
}

export async function getGeneralMarketSentiment(query: string, offChainContext: string = ""): Promise<any> {
  const prompt = `Analyze the following query for general market sentiment: "${query}".
      Context (Off-chain Data): ${offChainContext}
      
      CRITICAL INSTRUCTIONS:
      1. Provide a professional, high-value Market Sentiment Report.
      2. Synthesize news, market trends, and general Base chain activity.
      3. Identify potential risks and opportunities.
      4. Output a JSON object with:
         {
           "summary": "string (detailed, 2-3 sentences)",
           "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
           "keyTrends": ["string", "string"],
           "riskLevel": "LOW" | "MEDIUM" | "HIGH",
           "actionableStrategy": "string (specific advice based on sentiment)",
           "confidence": number (0-1)
         }
      
      Output JSON:`;
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    return [{
      author: "Noisezer AI",
      content: `Sentiment: ${parsed.sentiment}. Summary: ${parsed.summary}`,
      signal: {
        ...parsed,
        category: "MARKET_SENTIMENT"
      }
    }];
  } catch (error) {
    console.error('Error parsing LLM sentiment output:', error);
    return [];
  }
}

export async function searchSignalServerCoT(query: string, offChainContext: string = ""): Promise<any> {
  // Data Pruning: Only pass essential context
  const prunedContext = offChainContext.substring(0, 2000); 

  // Chain-of-Thought Prompting with strict JSON output constraints
  const prompt = `Analyze the following query for actionable financial alpha: "${query}".
      Context (Off-chain Data): ${prunedContext}
      
      CRITICAL INSTRUCTIONS:
      1. Think step-by-step internally (Chain-of-Thought).
      2. Output ONLY a valid JSON array. Do not include any conversational text, thinking text, or explanations.
      3. The output must start with '[' and end with ']'.
      4. Focus on:
         - Synthesize: You MUST combine the provided Off-chain Context (News/Polymarket) with the provided On-chain Data (DexScreener: price, liquidity, volume, FDV, MarketCap).
         - Smart money flow analysis.
         - On-chain volume divergence.
         - Social sentiment vs. On-chain reality.
         - Risk/Reward Ratio.
      5. MANDATORY JSON SCHEMA for each object:
         {
           "type": "INTELLIGENCE_FEED",
           "token": {
             "name": "string",
             "symbol": "string",
             "contract_address": "string (MUST be the CA provided in the query)",
             "chain": "string",
             "narrative": "string"
           },
           "market_data": {
             "price_usd": "string",
             "market_cap": "string",
             "liquidity_usd": "string",
             "volume_24h": "string",
             "holders": "string",
             "pool_age": "string",
             "fdv": "string",
             "total_supply": "string"
           },
           "sentiment": "NEUTRAL / HIGH RISK",
           "confidence": number (50-70 for micro-caps),
           "risk_level": "HIGH",
           "action": "N/A - Monitor only",
           "key_metrics": {
             "security_score": "string",
             "wallet_adoption": "string",
             "github_activity": "string",
             "whale_concentration": "string"
           },
           "anomaly_detection": {
             "detected": boolean,
             "notes": "string"
           },
           "rationale": "string",
           "disclaimer": "Noisezer provides market data and anomaly detection. We do NOT provide investment advice, buy/sell recommendations, price predictions, or trading signals. Users must make own decisions based on provided data. Noisezer is not liable for trading losses.",
           "last_updated": "${new Date().toISOString().split('T')[0]}",
           "sources": ["DexScreener", "CoinGecko", "Bankr.bot", "Basescan"]
         }
      6. If the query contains a contract address, you MUST populate the 'contract_address' field.
      7. Always populate all fields. If data is unavailable, use 'N/A' or appropriate placeholder.
      8. For micro-cap tokens (< $100K MC), risk_level MUST be 'HIGH' and action MUST be 'N/A - Monitor only'.

      Output JSON:`;
  
  // Selective Model Routing: Use Pro for complex analysis, Flash for fast filtering
  const model = query.length > 50 ? 'gemini-3.1-pro' : 'gemini-3.1-flash-lite';
  
  try {
    const content = await requestLLM(prompt, model, 0);
    
    // Robust parsing: Extract JSON array from text even if it contains thinking text
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const cleanedContent = jsonMatch ? jsonMatch[0] : content.replace(/```json\n?|\n?```/g, '').trim();
    
    if (!cleanedContent || cleanedContent === '[]') {
      return [];
    }
    
    const parsed = JSON.parse(cleanedContent);
    const signals = Array.isArray(parsed) ? parsed : [parsed];
    
    return signals.map((s: any) => ({
      author: "Noisezer AI",
      content: s.rationale || `Sentiment: ${s.sentiment || 'N/A'}. Confidence: ${s.confidence || 0}%.`,
      url: s.sources?.[0] || "https://x.com/noisezer_main",
      signal: {
        ...s,
        type: s.type || 'INTELLIGENCE_FEED',
        githubActivity: s.key_metrics?.github_activity || 'N/A'
      }
    }));
  } catch (error) {
    console.error('Error parsing LLM search output (CoT):', error);
    return [];
  }
}

export async function analyzeNoiseServer(chain: string, targets: any[]): Promise<any> {
  const prompt = `Analyze the following targets for noise, manipulation, and divergence.
      Chain: ${chain}
      Targets: ${JSON.stringify(targets)}
      
      CRITICAL INSTRUCTIONS:
      1. Act as a Decision Gatekeeper.
      2. Output ONLY a valid JSON object.
      3. MANDATORY JSON SCHEMA:
         {
           "contract_address": "string",
           "noise_score": number (0-100),
           "manipulation_score": number (0-1),
           "divergence_score": number (0-1),
           "anomaly_score": number (0-1),
           "action": "PROCESS" | "IGNORE" | "WATCH",
           "primary_reason": "string",
           "confidence": number (0-1)
         }
      
      Output JSON:`;
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error parsing Noisezer analysis:', error);
    return [{ 
      id: 'error',
      contract_address: 'N/A',
      noise_score: 0,
      manipulation_score: 0,
      divergence_score: 0,
      anomaly_score: 0,
      action: 'IGNORE',
      primary_reason: 'Analysis failed: ' + (error instanceof Error ? error.message : String(error)),
      confidence: 0,
      timestamp: Date.now()
    }];
  }
}

