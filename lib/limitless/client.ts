// Limitless API Client
export class LimitlessClient {
  private apiKey: string;
  private privateKey: string;
  private baseUrl = 'https://api.limitless.exchange'; // Placeholder, needs verification

  constructor(apiKey: string, privateKey: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[LIMITLESS] Requesting: ${method} ${url}`);
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[LIMITLESS] API Error: ${response.status} ${response.statusText} for ${url}. Body: ${errorBody}`);
      throw new Error(`Limitless API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getMarkets() {
    return this.request('/market');
  }

  async placeOrder(marketId: string, side: 'YES' | 'NO', amount: string, price: string) {
    // In a real implementation, this would involve signing the order with the private key
    // For now, this is a placeholder for the API call
    return this.request('/order', 'POST', { marketId, side, amount, price });
  }
}

let client: LimitlessClient | null = null;

export function getLimitlessClient(): LimitlessClient {
  if (!client) {
    const apiKey = process.env.LIMITLESS_API_KEY;
    const privateKey = process.env.LIMITLESS_PRIVATE_KEY;
    if (!apiKey || !privateKey) {
      throw new Error('LIMITLESS_API_KEY and LIMITLESS_PRIVATE_KEY are required');
    }
    client = new LimitlessClient(apiKey, privateKey);
  }
  return client;
}
