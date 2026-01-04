
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
  costBasis: number; 
  currentPrice: number; 
  note?: string;
  sector?: AssetSector;
  repaymentDay?: number; 
  monthlyRepayment?: number;
  lastRepaymentMonth?: string; 
}

export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM
  assetName: string;
  amount: number;
  currency: 'TWD' | 'USD';
  note?: string;
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
  date: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  note?: string;
  createdAt?: string; // YYYY-MM-DD
  // New breakdown fields
  twStocks?: number;
  usStocks?: number;
  cash?: number;
}

export interface GeminiAnalysisResult {
  markdown: string;
  loading: boolean;
  error?: string;
}
