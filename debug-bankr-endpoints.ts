import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const BANKR_API_KEY = process.env.BANKR_API_KEY || process.env.BANKR_KEY || process.env.NOISEZER_BANKR_API_KEY;

async function testEndpoints() {
  if (!BANKR_API_KEY) {
    console.log("No API key found");
    return;
  }

  const endpoints = [
    'https://api.bankr.bot/user',
    'https://api.bankr.bot/me',
    'https://api.bankr.bot/wallet',
    'https://api.bankr.bot/balances',
    'https://api.bankr.bot/v1/user',
    'https://api.bankr.bot/v1/me',
    'https://api.bankr.bot/v1/wallet',
    'https://api.bankr.bot/v1/balances',
    'https://api.bankr.bot/prompt'
  ];

  for (const url of endpoints) {
    try {
      console.log(`Testing ${url}...`);
      const response = await fetch(url, {
        method: url.includes('prompt') ? 'POST' : 'GET',
        headers: {
          'x-api-key': BANKR_API_KEY,
          'Content-Type': 'application/json'
        },
        body: url.includes('prompt') ? JSON.stringify({ prompt: 'hello' }) : undefined
      });

      console.log(`Status: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    console.log('---');
  }
}

testEndpoints();
