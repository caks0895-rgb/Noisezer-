# Noisezer A2A API Documentation

## Introduction
Noisezer is a high-frequency market data filter and Alpha discovery engine designed for AI Agents. This API provides programmatic access to on-chain insights, prediction market data, and builder discovery signals.

## Authentication & Monetization (X402)
Noisezer utilizes the **X402 protocol** for seamless, autonomous micropayments.

1.  **Free Tier:** Every agent receives **5 free queries per day**. Provide a unique `agentId` in the request body to track your quota.
2.  **Paid Tier:** Once the free quota is exhausted, agents must use X402-enabled wallets to pay per-request.
3.  **Authentication:** For high-volume users, an API key is available via the `X-Noisezer-API-Key` header.

### X402 Payment Request
When paying per-query, include the following in your request body:
```json
{
  "contract_address": "0x...",
  "agentId": "agent-uuid",
  "payment_signature": "0x...", // EIP-712 signature of the request
  "payment_amount": "1000000"    // Amount in wei (e.g., 0.001 USDC)
}
```

## Endpoints

### 1. Alpha Discovery (Pull)
Request specific market insights or alpha reports by providing a contract address.

*   **Endpoint:** `POST /api/search`
*   **Response (JSON):**
    ```json
    {
      "author": "Noisezer AI",
      "content": "Rationale explanation...",
      "signal": {
        "type": "TRUTH_REPORT",
        "nti_score": 85, // Range: 0-100
        "confidence": 0.92, // Range: 0.0-1.0
        "verdict": "ALPHA_SIGNAL", // Valid: ALPHA_SIGNAL, BS_SIGNAL, NEUTRAL, OPPORTUNITY_LOW, OPPORTUNITY_HIGH
        "data_points": { "liquidity": "50000", "holders": 100, "age": "2 days" },
        "rationale": "...",
        "last_updated": "2026-03-30"
      }
    }
    ```

### 2. Real-Time Alpha (Push)
Subscribe to real-time signals via WebSocket.

*   **Protocol:** WebSocket
*   **Connection:** `wss://<YOUR_NOISEZER_URL>/`
*   **Heartbeat:** Send `{"action": "ping"}` every 30 seconds to maintain connection.
*   **Reconnection:** Implement exponential backoff (starting at 1s, max 30s).

#### Subscription Format
```json
{
  "action": "subscribe",
  "type": "signal-updates",
  "filters": {
    "contract_address": "0x...",  // optional
    "signal_type": "GITHUB_ALPHA",  // optional
    "min_confidence": 0.8
  }
}
```
*   **Unsubscribe:** `{"action": "unsubscribe", "type": "signal-updates"}`

## Admin / System Monitor (Jalur Khusus)
This endpoint is for internal monitoring of Noisezer's autonomous operations, agent status, and transaction logs. It also supports posting to X (Twitter).

*   **Endpoint:** `POST /api/admin/chat`
*   **Header:** `X-Admin-API-Key: <YOUR_ADMIN_API_KEY>`
*   **Body (Monitoring):**
    ```json
    {
      "question": "How many agents are online and what is their current task?"
    }
    ```
*   **Body (Post to X):**
    ```json
    {
      "question": "post to X: This is a test tweet from Noisezer."
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "response": "Tweet posted successfully: \"This is a test tweet from Noisezer.\""
    }
    ```
