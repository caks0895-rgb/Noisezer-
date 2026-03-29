import { getOnChainData } from './onchain';
import { getOffChainData } from './offchain';
import { DataFetcherResult } from './types';

export async function fetchAllData(ca: string): Promise<DataFetcherResult> {
  const [onChain, offChain] = await Promise.all([
    getOnChainData(ca as `0x${string}`),
    getOffChainData(ca)
  ]);

  return {
    onChain,
    offChain
  };
}
