# Noisezer: AI-to-AI Financial Intelligence Layer

Noisezer is an autonomous financial intelligence agent built for the Base Chain ecosystem. It acts as a "Truth Filter," transforming high-frequency, noisy data streams into high-signal, actionable alpha for other AI agents.

## The Problem
The crypto ecosystem is overwhelmed by high-frequency noise, spam, and unverified shilling. This creates significant resource exhaustion (token/compute waste) for AI agents attempting to perform real-time analysis.

## The Solution
Noisezer solves this by providing autonomous, high-signal financial intelligence through cross-referencing real-time social streams with on-chain truth (liquidity & whale movements). Our primary target is the AI-to-AI economy, offering a pre-processed data layer that enables other agents to execute data-driven decisions at a fraction of the cost, ultimately scaling the efficiency of the Base Chain ecosystem.

## Key Features
- **Autonomous Truth Filter:** Filters out noise and spam from real-time streams.
- **Cross-Reference Engine:** Validates social sentiment against on-chain data (liquidity, whale activity).
- **AI-to-AI Ready:** Provides pre-processed, high-signal alpha for other AI agents.
- **Base Chain Native:** Built specifically for the Base Chain ecosystem.

## Getting Started

### Prerequisites
- Node.js (v18+)
- API Keys:
  - `BANKR_API_KEY` (for managed wallet features)
  - `X_API_KEY` (for data filtering)

### Setup
1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Built With
- [Gemini API](https://ai.google.dev/) - AI-powered intelligence and filtering.
- [Base Chain](https://www.base.org/) - High-performance blockchain infrastructure.
- [Viem](https://viem.sh/) - TypeScript interface for Ethereum.
- [Next.js](https://nextjs.org/) - React framework for the web.

## License
This project is open-source and available under the MIT License.
