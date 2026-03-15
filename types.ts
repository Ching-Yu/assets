
export enum AssetType {
  TW_STOCK = 'TW_STOCK',
  US_STOCK = 'US_STOCK',
  CASH_TWD = 'CASH_TWD',
  CASH_USD = 'CASH_USD',
  LOAN_TWD = 'LOAN_TWD' // New: Credit Loan / Liabilities
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string; // Ticker or Name (e.g., AAPL, 2330, 信貸)
  shares: number; // For stocks. For loans, this can be 1.
  costBasis: number; // Avg cost. For loans, this can be the interest rate (optional usage)
  currentPrice: number; // Market price. For loans, this is the outstanding balance.
  note?: string;
}

export interface PortfolioSummary {
  totalAssetsTwd: number;
  totalLiabilitiesTwd: number;
  netWorthTwd: number;
  totalValueUsd: number; // Net worth in USD
  allocation: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface HistoryRecord {
  id: string;
  date: string; // YYYY-MM (e.g., "2023-10")
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  note?: string;
}

export interface GeminiAnalysisResult {
  markdown: string;
  loading: boolean;
  error?: string;
}
