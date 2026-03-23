// lib/economic-engine.ts

// Simple in-memory tracking for now. 
// In a production app, this would be persisted in a database.

const COST_PER_LLM_REQUEST = 0.005; // Estimated cost per LLM request in USD
const REVENUE_PER_PAID_SEARCH = 0.05; // Revenue per paid search in USD

interface EconomicState {
  totalApiCosts: number;
  totalRevenue: number;
}

const state: EconomicState = {
  totalApiCosts: 0,
  totalRevenue: 0,
};

export function recordApiCost() {
  state.totalApiCosts += COST_PER_LLM_REQUEST;
}

export function recordRevenue() {
  state.totalRevenue += REVENUE_PER_PAID_SEARCH;
}

export function getEconomicSummary() {
  return {
    ...state,
    profit: state.totalRevenue - state.totalApiCosts,
  };
}
