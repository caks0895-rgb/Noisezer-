# Noisezer Ecosystem Roadmap

## Vision
Autonomous Agent on Base Chain, self-funding via X402, targeting Alpha seekers and Prediction Market Agents (Polymarket).

## Phase 1: Monetization & Access Control (Foundation)
- [x] Refine X402 Pay-per-Query logic in `/api/alpha`.
- [x] Implement Free Tier (3 queries/day) + Rate Limiting.
- [x] Implement Subscription Model (Wallet-based SIWE/Signature).

## Phase 2: Consensus Engine & Data Fusion (The 30% Opportunity)
- [x] Build Data Adapters (On-chain, News, Polymarket, Social, GitHub).
  - [x] Polymarket Adapter Structure
  - [x] Base Chain Adapter Structure
- [x] Implement Data Normalizer (0.0 - 1.0 scale).
- [x] Develop Consensus Engine (Weighted Fusion: 50/20/15/10/5).
- [x] Build Background Caching (Firestore state store).
- [x] Create specialized endpoint `/api/predict` (JSON-only).

## Phase 3: Agent-to-Agent (A2A) Trust
- [ ] Implement "Noisezer Consensus Score" (Self-critique mechanism).
- [ ] Add `alpha_decay_rate` to signals (to mark stale alpha).
- [ ] Implement Agent Reputation System (based on signal accuracy).

## Phase 3.5: Optimization & Cost Management
- [ ] Implement Chain-of-Thought (CoT) prompting for LLM.
- [ ] Implement Selective Model Routing (Flash vs Pro).
- [ ] Data Pruning for LLM input optimization.

## Phase 4: Growth & SDK
- [ ] Publish Noisezer SDK (NPM Package).
- [ ] Create public PnL Leaderboard for autonomous trading.
- [ ] Documentation for Agent Builders.

## Phase 5: Defensive & Safety
- [ ] Implement Circuit Breaker (Stop trading if loss > 10% in 1h).
- [ ] Risk Management dashboard for autonomous operations.
