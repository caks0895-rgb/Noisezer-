import { createPublicClient, http, createWalletClient, parseEther, formatEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { base } from 'viem/chains';

// Base Mainnet RPC
const RPC_URL = 'https://mainnet.base.org';

// Simple Cache for Bankr API
const bankrCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Get Private Key for X402 payments
export const BANKR_API_KEY = process.env.BANKR_API_KEY || process.env.BANKR_KEY || process.env.NOISEZER_BANKR_API_KEY;
const NOISEZER_PRIVATE_KEY = (process.env.NOISEZER_PRIVATE_KEY as `0x${string}`) || process.env.PRIVATE_KEY || generatePrivateKey();

export const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

/**
 * Generate or get Noisezer Wallet
 * In production, this should be stored securely (e.g., KMS, Vault, or Encrypted DB)
 */
export function getNoisezerWallet(privateKey?: `0x${string}`) {
  if (!privateKey) {
    return null;
  }
  
  const account = privateKeyToAccount(privateKey);
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(RPC_URL),
  });

  return { account, walletClient };
}

/**
 * Get recent activity (latest block info) on Base
 */
export async function getRecentBaseActivity() {
  try {
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    return {
      blockNumber: block.number.toString(),
      transactionCount: block.transactions.length,
      timestamp: block.timestamp.toString(),
    };
  } catch (error) {
    console.error('Error fetching on-chain activity:', error);
    return null;
  }
}

/**
 * Get basic token info (name, symbol, decimals, totalSupply) from contract
 */
export async function getTokenInfo(contractAddress: `0x${string}`) {
  const abi = [
    { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
    { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
    { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  ] as const;

  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({ address: contractAddress, abi, functionName: 'name' }),
      publicClient.readContract({ address: contractAddress, abi, functionName: 'symbol' }),
      publicClient.readContract({ address: contractAddress, abi, functionName: 'decimals' }),
      publicClient.readContract({ address: contractAddress, abi, functionName: 'totalSupply' }),
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString(),
      success: true
    };
  } catch (error) {
    console.error(`Error fetching token info for ${contractAddress}:`, error);
    return { success: false, error: 'Failed to fetch token info' };
  }
}

/**
 * Get ETH balance on Base
 */
export async function getBaseBalance(address: `0x${string}`) {
  try {
    const balance = await publicClient.getBalance({ address });
    return formatEther(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
}

/**
 * Helper to handle Bankr API requests with X402 payment support
 */
export async function requestBankr(
  url: string,
  options: RequestInit,
  providedApiKey: string,
  retryCount = 0
): Promise<Response> {
  const apiKey = (providedApiKey || BANKR_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Bankr API key is required');
  }

  // Use the mandatory X-API-Key header
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  console.log(`requestBankr ${url} (Retry: ${retryCount})`);
  
  const response = await fetch(url, { ...options, headers });
  console.log(`requestBankr ${url} returned status ${response.status}`);
  
  // Handle X402 Payment Required
  if (response.status === 402 && retryCount < 1) {
    console.log(`[BANKR] 402 Payment Required for ${url}. Attempting X402 payment...`);
    try {
      const errorData = await response.json();
      const paymentInfo = errorData.accepts?.[0];
      
      if (!paymentInfo) return response;

      const privateKey = NOISEZER_PRIVATE_KEY;
      if (!privateKey) return response;

      const { payTo, maxAmountRequired, asset } = paymentInfo;
      const targetAddress = payTo || paymentInfo.address;
      const targetAmount = maxAmountRequired || paymentInfo.amount;
      
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http(RPC_URL),
      });

      let hash: `0x${string}`;

      if (asset && asset !== '0x0000000000000000000000000000000000000000' && asset.toLowerCase() !== 'eth') {
        const abi = [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'recipient', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ] as const;

        const { request } = await publicClient.simulateContract({
          account,
          address: asset as `0x${string}`,
          abi,
          functionName: 'transfer',
          args: [targetAddress as `0x${string}`, BigInt(targetAmount)]
        });
        hash = await walletClient.writeContract(request);
      } else {
        hash = await walletClient.sendTransaction({
          to: targetAddress as `0x${string}`,
          value: BigInt(targetAmount),
        });
      }

      await publicClient.waitForTransactionReceipt({ hash });

      return await requestBankr(url, {
        ...options,
        headers: {
          ...headers,
          'X-PAYMENT': JSON.stringify({
            transactionHash: hash,
            network: 'base',
            chainId: 8453
          }),
        }
      }, apiKey, retryCount + 1);
    } catch (e) {
      console.error('[X402] Payment flow failed:', e);
      return response;
    }
  }

  return response;
}

/**
 * Bankr API Integration for Real Swaps on Base
 */
export async function bankrSwap(
  apiKey: string,
  fromToken: string,
  toToken: string,
  amount: string
) {
  console.log(`[BANKR] Executing swap: ${amount} ${fromToken} -> ${toToken} on Base`);

  // Updated Agent API Endpoints
  const endpoints = [
    { url: 'https://api.bankr.bot/agent/prompt', method: 'POST', body: { prompt: `swap ${amount} ${fromToken} to ${toToken} on Base` } }
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[BANKR] Trying endpoint: ${endpoint.url}`);
      const response = await requestBankr(endpoint.url, {
        method: endpoint.method,
        body: JSON.stringify(endpoint.body),
      }, apiKey);

      if (response.status === 404) continue;

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bankr API Error ${response.status}: ${errorText.substring(0, 100)}`);
      }

      if (isJson) {
        const data = await response.json();
        console.log(`[BANKR] Success from ${endpoint.url}:`, JSON.stringify(data));
        
        // Handle both async (jobId) and sync (transactionHash) responses
        return {
          success: true,
          jobId: data.jobId || data.id || data.job_id,
          transactionHash: data.transactionHash || data.txHash || data.hash,
          message: data.message || 'Operation initiated via Bankr',
        };
      }
    } catch (error) {
      console.error(`[BANKR] Error with endpoint ${endpoint.url}:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All Bankr swap endpoints failed');
}

/**
 * Fetch Bankr Balances via Prompt (Agent API Flow)
 */
export async function getBankrBalances(apiKey: string) {
  if (!apiKey) {
    console.warn('[BANKR] getBankrBalances called without API key. Using official fallback.');
    const OFFICIAL_ADDRESS = '0xfaaa2fd28530524818154968048738a614d4b1e2';
    const ethBalance = await getBaseBalance(OFFICIAL_ADDRESS as `0x${string}`);
    return { address: OFFICIAL_ADDRESS, balances: [{ chain: 'base', symbol: 'ETH', amount: ethBalance }], success: true };
  }

  try {
    console.log(`[BANKR] Fetching balances...`);
    
    const cacheKey = `balances_${apiKey}`;
    const cached = bankrCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[BANKR] Returning cached balances');
      return cached.data;
    }

    // Official Agent Endpoints
    const endpoints: { url: string; method: string; body?: any }[] = [
      { url: 'https://api.bankr.bot/agent/me', method: 'GET' },
      { url: 'https://api.bankr.bot/agent/balances', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`[BANKR] Trying balance endpoint: ${endpoint.url}`);
        const response = await requestBankr(endpoint.url, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        }, apiKey);

        if (response.ok) {
          const data = await response.json();
          console.log(`[BANKR] SUCCESS from ${endpoint.url}`);
          const fs = await import('fs');
          fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] SUCCESS from ${endpoint.url}: ${JSON.stringify(data)}\n`);
          
          const jobId = data.jobId || data.id || data.job_id;
          
          let result: any;
          if (jobId) {
            // Poll for the result if it's an async job
            let attempts = 0;
            const maxAttempts = 5;
            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const status = await getBankrJobStatus(apiKey, jobId);
              
              if (status.status === 'completed' || status.status === 'success') {
                const address = status.address || (status.message?.match(/0x[a-fA-F0-9]{40}/)?.[0]);
                if (address) {
                  const ethBalance = await getBaseBalance(address as `0x${string}`);
                  result = {
                    address,
                    balances: [{ chain: 'base', symbol: 'ETH', amount: ethBalance }],
                    success: true
                  };
                  break;
                }
              }
              if (status.status === 'failed' || status.status === 'error') break;
              attempts++;
            }
          } else {
            // Direct response
            const address = data.address || data.walletAddress || data.wallet?.address || data.user?.wallet || data.account || data.user?.address;
            if (address) {
              const ethBalance = await getBaseBalance(address as `0x${string}`);
              result = {
                address,
                balances: [{ chain: 'base', symbol: 'ETH', amount: ethBalance }],
                success: true
              };
            }
          }

          if (result) {
            bankrCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
          }
        } else {
          const errorText = await response.text();
          console.warn(`[BANKR] Endpoint ${endpoint.url} failed with status ${response.status}: ${errorText.substring(0, 100)}`);
          const fs = await import('fs');
          fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] Balance ERROR from ${endpoint.url} (Status ${response.status}): ${errorText}\n`);
        }
      } catch (e) {
        console.warn(`[BANKR] Failed endpoint ${endpoint.url}:`, e instanceof Error ? e.message : String(e));
        const fs = await import('fs');
        fs.appendFileSync('bankr-debug.log', `[${new Date().toISOString()}] Endpoint EXCEPTION from ${endpoint.url}: ${e instanceof Error ? e.message : String(e)}\n`);
      }
    }

    // Final Fallback: Use Official Noisezer Address
    return await getBankrWalletFallback();
  } catch (error) {
    console.error('[BANKR] Error in getBankrBalances:', error);
    return await getBankrWalletFallback();
  }
}

/**
 * Final fallback to get wallet address
 */
async function getBankrWalletFallback() {
  const OFFICIAL_ADDRESS = '0xfaaa2fd28530524818154968048738a614d4b1e2';
  console.warn(`[BANKR] Falling back to official Noisezer address: ${OFFICIAL_ADDRESS}.`);
  const ethBalance = await getBaseBalance(OFFICIAL_ADDRESS as `0x${string}`);
  return {
    address: OFFICIAL_ADDRESS,
    balances: [{ chain: 'base', symbol: 'ETH', amount: ethBalance }],
    success: true
  };
}

/**
 * Generic Bankr Prompt Helper
 */
export async function bankrPrompt(apiKey: string, prompt: string) {
  const endpoints = [
    'https://api.bankr.bot/agent/prompt'
  ];

  for (const url of endpoints) {
    try {
      console.log(`[BANKR] Trying prompt endpoint: ${url}`);
      const response = await requestBankr(url, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }, apiKey);

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
    } catch (e) {
      // Try next
    }
  }
  return { success: false, error: 'All prompt endpoints failed' };
}

/**
 * Poll Bankr Job Status
 */
export async function getBankrJobStatus(apiKey: string, jobId: string) {
  const endpoints = [
    `https://api.bankr.bot/agent/status/${jobId}`,
    `https://api.bankr.bot/agent/jobs/${jobId}`,
    `https://api.bankr.bot/agent/job/${jobId}`
  ];

  let lastStatus = 0;
  for (const url of endpoints) {
    try {
      const response = await requestBankr(url, { method: 'GET' }, apiKey);
      lastStatus = response.status;
      
      console.log(`[BANKR] getBankrJobStatus ${url} status: ${response.status}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`[BANKR] getBankrJobStatus ${url} data: ${JSON.stringify(data)}`);
          return {
            status: data.status || data.state || 'unknown',
            transactionHash: data.transactionHash || data.txHash || data.hash,
            message: data.response || data.message || data.error || data.result || '',
            address: data.address || data.walletAddress
          };
        } else {
          const text = await response.text();
          console.log(`[BANKR] getBankrJobStatus ${url} returned non-JSON: ${text.substring(0, 100)}`);
          return { status: 'error', message: `Non-JSON response: ${text.substring(0, 50)}` };
        }
      } else {
        const errorText = await response.text();
        console.log(`[BANKR] getBankrJobStatus ${url} error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`[BANKR] getBankrJobStatus ${url} exception: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { status: 'error', message: `Could not fetch job status (Last Status: ${lastStatus})` };
}
