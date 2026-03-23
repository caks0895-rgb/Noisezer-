import { requestBankr, BANKR_API_KEY } from './blockchain';

async function requestLLM(prompt: string): Promise<any> {
  const url = 'https://llm.bankr.bot/v1/chat/completions';
  const apiKey = BANKR_API_KEY || "";
  
  const response = await requestBankr(url, {
    method: 'POST',
    body: JSON.stringify({
      model: 'gemini-3.1-flash-lite',
      messages: [{ role: 'user', content: prompt }]
    }),
  }, apiKey);

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  }
  throw new Error(`LLM Gateway Error: ${response.statusText}`);
}

export async function analyzePostServer(text: string): Promise<any> {
  const prompt = `Analyze this X post for high-value financial alpha (Base Chain smart money, new contract deployments) or high-volume Polymarket opportunities.
      Filter noise. Return JSON:
      {
        "score": 0-100,
        "summary": "1-sentence summary",
        "category": "ALPHA" | "NEWS" | "SPAM",
        "isNoise": boolean
      }
      Post: "${text}"`;
  
  const content = await requestLLM(prompt);
  const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedContent || "{}");
}

export async function searchSignalServer(query: string): Promise<any> {
  const prompt = `Analyze the following query for actionable financial alpha: "${query}".
      Focus: Provide a clear, actionable signal. If the query is about Base Chain, focus on Base. If about Polymarket, focus on Polymarket. Do not force Base Chain focus if not requested.
      
      CRITICAL INSTRUCTIONS:
      1. Cross-reference: Compare Polymarket odds with current news headlines and on-chain Base Chain activity (if applicable).
      2. Detect Divergence: Is the market mispricing risk? Is there a disconnect between news sentiment and on-chain whale movement?
      3. Quantify: Provide specific data points (e.g., "Odds moved X% in Y minutes").
      4. Action: Provide a clear "Action" (e.g., "SHORT/LONG/HEDGE/WAIT").
      5. If no actionable alpha is found, return: "No actionable alpha detected. Market is efficient."
      6. JSON Output: Ensure all JSON strings use double quotes and avoid single quotes inside string values.

      Current timestamp: ${Date.now()}
      Return JSON:
      {
        "score": 0-100,
        "summary": "Actionable insight",
        "divergence": "Explanation of market divergence without using single quotes",
        "action": "BUY/SELL/WAIT",
        "category": "ALPHA" | "NEWS" | "PREDICTION"
      }`;
  
  try {
    const content = await requestLLM(prompt);
    console.log('LLM Search Output:', content);
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    if (!cleanedContent || cleanedContent === '[]') {
      return [{
        author: "Noisezer AI",
        content: `No specific alpha found for "${query}". Market sentiment is currently neutral.`,
        url: "https://x.com/noisezer_main",
        signal: { score: 50, summary: "Neutral sentiment", category: "NEWS" }
      }];
    }
    
    // Parse the JSON object and wrap it in the expected list format
    const parsed = JSON.parse(cleanedContent);
    return [{
      author: "Noisezer AI",
      content: parsed.summary,
      url: "https://x.com/noisezer_main",
      signal: parsed
    }];
  } catch (error) {
    console.error('Error parsing LLM search output:', error);
    return [{
      author: "Noisezer AI",
      content: `Unable to process request for "${query}". Please try again.`,
      url: "https://x.com/noisezer_main",
      signal: { score: 0, summary: "Error", category: "NEWS" }
    }];
  }
}

export async function analyzeDiscoveryDataServer(data: any): Promise<any> {
  const prompt = `Analyze this raw crypto discovery data (Base Chain/Polymarket) for high-value insights.
      Return JSON:
      {
        "alphaScore": 0-100,
        "summary": "2-sentence summary",
        "keyOpportunities": ["...", "...", "..."],
        "riskLevel": "LOW" | "MEDIUM" | "HIGH"
      }
      Data: "${JSON.stringify(data)}"`;
  
  const content = await requestLLM(prompt);
  const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedContent || "{}");
}
