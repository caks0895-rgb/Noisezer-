import { NTIResult } from "../../../lib/nti-engine/types";
import { requestLLM } from "../../../lib/gemini-server";

export async function generateNarrative(result: NTIResult): Promise<string> {
  const prompt = `
    Analyze this Noisezer NTI Report:
    Score: ${result.nti_score}
    Verdict: ${result.verdict}
    On-Chain: ${JSON.stringify(result.analysis.on_chain)}
    Off-Chain: ${JSON.stringify(result.analysis.off_chain)}
    
    Provide a concise, professional narrative explaining this gap between reality and hype.
  `;

  const responseText = await requestLLM(prompt, "gemini-3-flash", 0);

  return responseText || "No narrative generated.";
}
