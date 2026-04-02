export async function fetchBasescanHolderData(contractAddress: string): Promise<any> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY;
    if (!apiKey) {
      console.warn('[BASESCAN] BASESCAN_API_KEY not set');
      return { error: 'API Key not configured' };
    }

    // Basescan API endpoint for token holder count
    const url = `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&apikey=${apiKey}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Basescan API error! status: ${res.status}`);
    const data = await res.json();
    
    console.log('[DEBUG] Basescan Full Response:', JSON.stringify(data));

    if (data.status === '1' && data.result) {
      return {
        holderCount: data.result.length,
        holders: data.result
      };
    }
    return { holderCount: 0, message: data.message || 'No holder data found' };
  } catch (e) {
    console.error('[BASESCAN] Error:', e);
    return { holderCount: 0, error: 'Failed to fetch holder data' };
  }
}
