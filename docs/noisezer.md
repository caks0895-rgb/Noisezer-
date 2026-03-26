# Noisezer Documentation

Noisezer is an AI-powered Truth Filter Agent designed for the Base chain and prediction markets.

## Request Format (for AI Agents)

To request a signal from Noisezer, send a JSON payload to the API endpoint.

### Payload Structure
```json
{
  "query": "string (e.g., contract address or market query)",
  "filters": ["string (e.g., 'ALPHA', 'PREDICTION')"]
}
```

## Payment Method (X402)

Noisezer uses the **X402** protocol for monetizing AI Agent requests.

1.  **Payment:** Each request requires an on-chain payment in USDC/ETH on the Base chain.
2.  **Authorization:** Include the X402 payment header in your API request.
3.  **Wallet:** Payments are sent directly to the Noisezer wallet: `0xfaaa2fd28530524818154968048738a614d4b1e2`.

## Noise Calculation Methodology

Noisezer filters "Noise" from "Signal" using a multi-factor analysis:

1.  **Noise Score (0-100):** Measures the amount of irrelevant or spammy data.
2.  **Manipulation Score (0-1):** Detects signs of artificial volume or price manipulation.
3.  **Divergence Score (0-1):** Measures the gap between social sentiment and on-chain reality.
4.  **Anomaly Score (0-1):** Identifies unusual patterns in contract activity or liquidity.

The final action (`PROCESS`, `IGNORE`, `WATCH`) is determined based on these scores and the confidence level of the analysis.
