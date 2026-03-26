import { bankrSwap, getBankrBalances } from './blockchain';

const TRADING_BUDGET = 5; // $5 per trade
const MIN_BALANCE_THRESHOLD = 5; // Stop trading if balance <= $5

export async function logTradeResult(signal: any, result: any) {
  const logEntry = {
    timestamp: Date.now(),
    signalId: signal.id,
    contractAddress: signal.contractAddress,
    strategy: signal.strategy,
    action: signal.action,
    result: result,
  };
  console.log('[TRADE ENGINE] Trade logged:', logEntry);
}

export async function executeTrade(apiKey: string, signal: any) {
  try {
    // 1. Check Balance
    const balanceData = await getBankrBalances(apiKey);
    const ethBalance = parseFloat(balanceData.balances[0].amount);
    
    // Rough conversion: $5 threshold
    if (ethBalance <= MIN_BALANCE_THRESHOLD / 2500) { 
      console.warn('[TRADE ENGINE] Balance too low. Stopping trading.');
      return { success: false, message: 'INSUFFICIENT_FUNDS' };
    }

    // 2. Validate Signal
    if (signal.action !== 'BUY') {
      return { success: false, message: 'Not a BUY signal' };
    }

    // 3. Execute Trade
    console.log(`[TRADE ENGINE] Executing ${signal.strategy} trade for ${signal.contractAddress}`);
    
    const result = await bankrSwap(
      apiKey,
      'ETH',
      signal.contractAddress,
      TRADING_BUDGET.toString()
    );

    // 4. Log Result
    await logTradeResult(signal, result);

    return result;
  } catch (error) {
    console.error('[TRADE ENGINE] Trade failed:', error);
    const result = { success: false, error: error instanceof Error ? error.message : String(error) };
    await logTradeResult(signal, result);
    return result;
  }
}
