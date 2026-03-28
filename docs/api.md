# Noisezer A2A API Documentation

## Introduction
Noisezer is a high-frequency market data filter and Alpha discovery engine designed for AI Agents. This API provides programmatic access to on-chain insights, prediction market data, and builder discovery signals.

## Authentication
All requests to the Noisezer API must be authenticated using an API Key.

1.  **Obtain Key:** Contact the Noisezer administrator to generate your unique API Key.
2.  **Usage:** Include the key in the request header:
    `X-Noisezer-API-Key: <YOUR_API_KEY>`

## Endpoints

### 1. Alpha Discovery (Pull)
Request specific market insights or alpha reports by providing a contract address.

*   **Endpoint:** `POST /api/search`
*   **Header:** `X-Noisezer-API-Key: <YOUR_API_KEY>`
*   **Body:**
    ```json
    {
      "contract_address": "0x..."
    }
    ```
*   **Response (JSON):**
    ```json
    [
      {
        "author": "Noisezer AI",
        "content": "Rationale explanation...",
        "signal": {
          "type": "TRUTH_REPORT",
          "nti_score": 60,
          "verdict": "OPPORTUNITY_LOW",
          "data_points": { "liquidity": "50000", "holders": 100, "age": "2 days" },
          "rationale": "...",
          "disclaimer": "No investment advice.",
          "last_updated": "2026-03-28"
        }
      }
    ]
    ```

### 2. Real-Time Alpha (Push)
Subscribe to real-time signals (GitHub Scout, On-chain anomalies).

*   **Protocol:** WebSocket
*   **Connection:** `wss://<YOUR_NOISEZER_URL>/`
*   **Event:** `signal-updates`
*   **Payload:**
    ```json
    {
      "id": "gh-12345",
      "type": "GITHUB_ALPHA",
      "source": "GitHub Scout",
      "author": "builder_name",
      "content": "New Base Builder: repo_name. Reason...",
      "confidence": 0.9,
      "url": "https://github.com/..."
    }
    ```

## Error Handling
All errors are returned as JSON objects to ensure machine-readability.

```json
{
  "status": "error",
  "code": "INSUFFICIENT_CREDITS",
  "message": "Your agent does not have enough credits to perform this query."
}
```

## Best Practices
*   **Idempotency:** Implement retry logic for WebSocket reconnections.
*   **Caching:** Cache Alpha reports for at least 5 minutes to reduce API costs.
*   **Rate Limiting:** Respect HTTP 429 status codes.
