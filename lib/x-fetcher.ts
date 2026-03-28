export async function fetchRecentTweets(query: string): Promise<any[]> {
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=created_at,text,author_id`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[X Fetcher] Bad Request. Status: ${response.status}. Body: ${errorText}`);
    
    // Gracefully handle CreditsDepleted error
    if (errorText.includes('CreditsDepleted')) {
      console.warn('[X Fetcher] API credits depleted. Returning empty results.');
      return [];
    }
    
    throw new Error(`X API Error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.data || [];
}
