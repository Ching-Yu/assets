
export enum AssetType {
  TW_STOCK = 'TW_STOCK',
  US_STOCK = 'US_STOCK',
  CASH_TWD = 'CASH_TWD',
  CASH_USD = 'CASH_USD',
  LOAN_TWD = 'LOAN_TWD'
}

export enum AssetSector {
  ETF = 'ETF',
  SEMICONDUCTOR = 'SEMICONDUCTOR', // 半導體
  TECH = 'TECH', // 科技 (軟體/硬體)
  FINANCE = 'FINANCE', // 金融
  TRADITIONAL = 'TRADITIONAL', // 傳產
  CRYPTO = 'CRYPTO', // 加密貨幣相關
  OTHER = 'OTHER' // 其他
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  shares: number;
  costBasis: number; // For stocks: avg cost. For loans: interest rate.
  currentPrice: number; // Market price. For loans: outstanding balance.
  note?: string;
  sector?: AssetSector; // New field for sector allocation
  // Automation fields for loans
  repaymentDay?: number; // 1-31
  monthlyRepayment?: number;
  lastRepaymentMonth?: string; // YYYY-MM
}

export interface PortfolioSummary {
  totalAssetsTwd: number;
  totalLiabilitiesTwd: number;
  netWorthTwd: number;
  totalValueUsd: number;
  allocation: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface HistoryRecord {
  id: string;
  date: string;
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
