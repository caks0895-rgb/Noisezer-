import { publicClient } from '../blockchain';
import { OnChainData } from './types';
import { fetchDexScreenerData } from '../adapters/dexscreener';
import { fetchBasescanHolderData } from '../adapters/basescan';

export async function getOnChainData(contractAddress: `0x${string}`): Promise<OnChainData | null> {
  try {
    const [totalSupply, decimals] = await Promise.all([
      publicClient.readContract({ address: contractAddress, abi: [{ name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const, functionName: 'totalSupply' }).catch(() => BigInt(0)),
      publicClient.readContract({ address: contractAddress, abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }] as const, functionName: 'decimals' }).catch(() => 18),
    ]);

    const [dexData, holderData] = await Promise.all([
      fetchDexScreenerData(contractAddress),
      fetchBasescanHolderData(contractAddress)
    ]);

    console.log('[DEBUG] DexScreener Data:', dexData);
    console.log('[DEBUG] Basescan Data:', holderData);

    return {
      liquidity: dexData.liquidityUsd ? parseFloat(dexData.liquidityUsd) : 0,
      holders: holderData.holderCount || 0,
      volume24h: dexData.volume24h ? parseFloat(dexData.volume24h) : 0,
      velocity: 0, // Placeholder
      isVerified: true,
      totalSupply: (Number(totalSupply) / Math.pow(10, decimals)).toString(),
    };
  } catch (error) {
    console.error('Error fetching on-chain data:', error);
    return null;
  }
}
