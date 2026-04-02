import { requestLLM } from './lib/gemini-server';

async function test() {
  console.log("Testing LLM connection with model: gemini-3-flash...");
  try {
    // We use a simple prompt to verify connectivity
    const response = await requestLLM("Hello, are you working?", "gemini-3-flash", 0);
    console.log("Success! Response:", response);
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

test();
