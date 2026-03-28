import { requestBankr, BANKR_API_KEY, getTokenInfo } from './blockchain';
import { calculateNTI, OnChainData, OffChainData } from './scoring';

export const NOISEZER_SYSTEM_PROMPT = `
You are Noisezer, a sophisticated market data analyst. Your goal is to provide accurate, objective analysis based on the provided On-Chain Data and Off-Chain Context.

CRITICAL FILTERING & RISK SCORING RULES:
1. Supply Filter: Do NOT flag supply > 1e12 as anomalous. Only flag if supply > 1e18 AND liquidity < $50K.
2. Liquidity Filter: Low < $100K, Medium $100K-$500K, Healthy > $500K.
3. Holder Distribution: Top 10 > 50% (High concentration - Red Flag), 30-50% (Medium), < 30% (Healthy).
4. Security Filter: Flag honeypot ONLY if >= 2 of (TokenSniffer, Go+, Quick Intel) report issues. If source code is verified, reduce risk score.
5. AI Narrative: If keywords like "AI Agent", "OpenClaw", "Nat Eliason", "FelixCraft" are present, reduce risk score.
6. Risk Score Logic:
   Risk Score = (Liquidity Score: 0-3) + (Holder Concentration: 0-3) + (Security Flags: 0-3) + (Age < 7 days ? +1 : 0)
   Max Score: 10.
   - Liquidity Score: Healthy=0, Medium=1, Low=3
   - Holder Concentration: Healthy=0, Medium=1, High=3
   - Security Flags: No issues=0, Issues=3

CRITICAL INSTRUCTIONS:
1. Think step-by-step internally (Chain-of-Thought).
2. Output ONLY a valid JSON array of objects.
3. If query contains a CA, populate 'contract_address'. If NOT, return 'N/A'. DO NOT hallucinate.
4. Always populate all fields. If data is unavailable, use 'N/A'.
`;

export const HUMAN_SYSTEM_PROMPT = `
You are Noisezer, a friendly and insightful market data analyst. Your goal is to help humans understand complex market data. 
Provide clear, structured, and conversational explanations. Use Markdown for readability. 
Always include a disclaimer that this is for data analysis only, not financial advice.

${NOISEZER_SYSTEM_PROMPT}
`;

export const MACHINE_SYSTEM_PROMPT = `
You are Noisezer, a high-frequency market data filter. Your goal is to provide raw data for AI agents. 
Output ONLY valid JSON. No conversational text. No explanations. Strictly follow the requested JSON schema.
${NOISEZER_SYSTEM_PROMPT}
`;

export const IMMUTABLE_SYSTEM_PROMPT = HUMAN_SYSTEM_PROMPT; // Default to human for backward compatibility

export async function requestLLM(prompt: string, model: string = 'gemini-3.1-flash-lite', temperature: number = 0, systemPrompt: string = HUMAN_SYSTEM_PROMPT): Promise<any> {
  const url = 'https://llm.bankr.bot/v1/chat/completions';
  const apiKey = BANKR_API_KEY || "";
  
  const response = await requestBankr(url, {
    method: 'POST',
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
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
  
  const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
  const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedContent || "{}");
}

export async function checkXAccess(): Promise<string> {
  const prompt = "Do you have direct, real-time access to X (Twitter) social data? Can you scrape or fetch live posts from X, or do you rely entirely on the context provided to you in the prompt?";
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
    return content;
  } catch (error) {
    return "Error checking X access capability.";
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
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
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
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
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

export async function getSentimentAnalysis(query: string): Promise<OffChainData> {
  const prompt = `Analyze the sentiment and narrative strength for: "${query}".
      Return JSON:
      {
        "sentimentScore": number (0-100),
        "narrativeStrength": number (0-100)
      }
      Output JSON:`;
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error getting sentiment:', error);
    return { sentimentScore: 50, narrativeStrength: 50 };
  }
}

export async function searchSignalServerCoT(query: string, onChain: OnChainData, offChain?: OffChainData): Promise<any> {
  // Use provided offChain data or fetch new sentiment if missing
  const offChainData = offChain || await getSentimentAnalysis(query);
  
  const { score, verdict } = calculateNTI(onChain, offChainData);

  const prompt = `Analyze the following data for actionable financial alpha: "${query}".
      Data: ${JSON.stringify({ onChain, offChain, score, verdict })}
      
      CRITICAL:
      1. Think step-by-step internally.
      2. Output ONLY a valid JSON array. No conversational text.
      3. Explain the NTI Score (${score}) and Verdict (${verdict}) factually based on the provided data.
      4. DO NOT calculate the score. Use the provided score.
      5. MANDATORY JSON SCHEMA:
         {
           "type": "TRUTH_REPORT",
           "nti_score": ${score},
           "verdict": "${verdict}",
           "data_points": { "liquidity": "${onChain.liquidity}", "holders": ${onChain.holders}, "age": "${onChain.ageDays} days" },
           "rationale": "string (factual explanation based on data)",
           "disclaimer": "Noisezer provides market data and anomaly detection. No investment advice.",
           "last_updated": "${new Date().toISOString().split('T')[0]}"
         }

      Output JSON:`;
  
  try {
    const content = await requestLLM(prompt, 'gemini-3.1-pro', 0, MACHINE_SYSTEM_PROMPT);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    const signals = Array.isArray(parsed) ? parsed : [parsed];
    
    return signals.map((s: any) => ({
      author: "Noisezer AI",
      content: s.rationale,
      signal: {
        ...s,
        type: s.type || 'TRUTH_REPORT'
      }
    }));
  } catch (error) {
    console.error('Error parsing LLM output (Deterministic):', error);
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
    const content = await requestLLM(prompt, 'gemini-3.1-flash-lite', 0, MACHINE_SYSTEM_PROMPT);
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

