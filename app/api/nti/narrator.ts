import { GoogleGenAI } from "@google/genai";
import { NTIResult } from "../../../lib/nti-engine/types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export async function generateNarrative(result: NTIResult): Promise<string> {
  const prompt = `
    Analyze this Noisezer NTI Report:
    Score: ${result.nti_score}
    Verdict: ${result.verdict}
    On-Chain: ${JSON.stringify(result.analysis.on_chain)}
    Off-Chain: ${JSON.stringify(result.analysis.off_chain)}
    
    Provide a concise, professional narrative explaining this gap between reality and hype.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "No narrative generated.";
}
