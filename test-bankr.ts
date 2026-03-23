import { getBankrBalances, bankrSwap } from './lib/blockchain';
import * as dotenv from 'dotenv';
dotenv.config();

const BANKR_API_KEY = process.env.BANKR_API_KEY || process.env.BANKR_KEY || process.env.NOISEZER_BANKR_API_KEY;

async function test() {
  console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('BANKR') || k.includes('KEY') || k.includes('PRIVATE')));
  
  if (!BANKR_API_KEY) {
    console.error('BANKR_API_KEY not found in environment (tried BANKR_API_KEY, BANKR_KEY, NOISEZER_BANKR_API_KEY)');
    return;
  }
  
  console.log(`BANKR_API_KEY found with length: ${BANKR_API_KEY.length}`);

  console.log('--- TESTING BANKR BALANCE ---');
  try {
    const balanceData = await getBankrBalances(BANKR_API_KEY);
    console.log('Balance Data:', JSON.stringify(balanceData, null, 2));
    
    const usdc = balanceData.balances?.find((b: any) => b.symbol === 'USDC' || b.symbol === 'usdc');
    console.log(`USDC Balance: ${usdc?.amount || '0'}`);

    if (parseFloat(usdc?.amount || '0') >= 1) {
      console.log('\n--- TESTING BANKR SWAP (1 USDC -> ETH) ---');
      const swapResult = await bankrSwap(BANKR_API_KEY, 'USDC', 'ETH', '1');
      console.log('Swap Result:', JSON.stringify(swapResult, null, 2));
    } else {
      console.log('\n[SKIP] USDC balance too low for swap test (< 1 USDC)');
    }
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

test();
