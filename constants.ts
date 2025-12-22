
import { AssetSector } from "./types";

export const DEFAULT_USD_TWD_RATE = 32.5;

export const ASSET_COLORS = {
  TW_STOCK: '#10b981', // emerald-500
  US_STOCK: '#3b82f6', // blue-500
  CASH: '#f59e0b',     // amber-500
  LOAN: '#f43f5e',     // rose-500
};

export const SECTOR_LABELS: Record<AssetSector, string> = {
  [AssetSector.ETF]: 'ETF (指數/高股息)',
  [AssetSector.SEMICONDUCTOR]: '半導體',
  [AssetSector.TECH]: '科技軟硬體',
  [AssetSector.FINANCE]: '金融保險',
  [AssetSector.TRADITIONAL]: '傳統產業',
  [AssetSector.CRYPTO]: '區塊鏈/加密',
  [AssetSector.OTHER]: '其他'
};

export const SECTOR_COLORS: Record<AssetSector, string> = {
  [AssetSector.ETF]: '#fbbf24',        // amber-400
  [AssetSector.SEMICONDUCTOR]: '#ef4444', // red-500
  [AssetSector.TECH]: '#3b82f6',       // blue-500
  [AssetSector.FINANCE]: '#10b981',    // emerald-500
  [AssetSector.TRADITIONAL]: '#a8a29e',// stone-400
  [AssetSector.CRYPTO]: '#8b5cf6',     // violet-500
  [AssetSector.OTHER]: '#64748b'       // slate-500
};

/**
 * Simple heuristic to guess sector based on ticker symbol or name
 */
export const detectSector = (input: string): AssetSector => {
  if (!input) return AssetSector.OTHER;
  const text = input.toUpperCase();
  
  // Keyword mapping priorities
  const rules: [AssetSector, string[]][] = [
    [AssetSector.ETF, ['ETF', '0050', '0056', '00878', '00929', '00919', '00940', '006208', 'VOO', 'QQQ', 'SPY', 'VTI', 'VT', 'SCHD', 'IVV', 'TQQQ', 'SOXL']],
    [AssetSector.SEMICONDUCTOR, ['2330', '2454', 'TSM', 'NVDA', 'AMD', 'INTC', 'AVGO', 'MU', 'TXN', 'QCOM', 'ARM', 'ASML', 'AMAT', 'LRCX', 'SMCI']],
    [AssetSector.TECH, ['AAPL', 'MSFT', 'GOOG', 'META', 'AMZN', 'TSLA', 'NFLX', 'ORCL', 'ADBE', 'CRM', '2317', '2382', '2357', 'PLTR', 'UBER']],
    [AssetSector.FINANCE, ['288', '289', '588', 'JPM', 'BAC', 'WFC', 'C', 'V', 'MA', 'BLK', 'GS', 'MS', 'BRK', 'VIG']],
    [AssetSector.TRADITIONAL, ['BA', 'CAT', 'DE', 'XOM', 'CVX', '2002', '1101', '1102', 'KO', 'PEP', 'MCD', 'COST', 'WMT']],
    [AssetSector.CRYPTO, ['BTC', 'ETH', 'COIN', 'MSTR', 'IBIT', 'FBTC', 'SOL', 'USDT', 'USDC']]
  ];

  for (const [sector, keywords] of rules) {
    if (keywords.some(k => text.includes(k))) return sector;
  }

  return AssetSector.OTHER;
};

export const MOCK_INITIAL_DATA = [
  {
    id: '1',
    type: 'TW_STOCK',
    name: '2330 台積電',
    shares: 1000,
    costBasis: 600,
    currentPrice: 1450, 
    note: 'Long term hold',
    sector: 'SEMICONDUCTOR'
  },
  {
    id: '2',
    type: 'US_STOCK',
    name: 'NVDA',
    shares: 20,
    costBasis: 450,
    currentPrice: 181.46,
    note: 'AI play',
    sector: 'SEMICONDUCTOR'
  },
  {
    id: '3',
    type: 'US_STOCK',
    name: 'VOO',
    shares: 15,
    costBasis: 380,
    currentPrice: 520,
    note: 'S&P 500 ETF',
    sector: 'ETF'
  },
  {
    id: '4',
    type: 'CASH_TWD',
    name: '台幣活存',
    shares: 1, 
    costBasis: 1,
    currentPrice: 500000, 
    note: 'Emergency Fund'
  },
  {
    id: '5',
    type: 'CASH_USD',
    name: '美金活存',
    shares: 1,
    costBasis: 1,
    currentPrice: 3000,
    note: 'Waiting for dip'
  },
  {
    id: '6',
    type: 'LOAN_TWD',
    name: '信用貸款',
    shares: 1,
    costBasis: 2.5, // Interest rate
    currentPrice: 800000,
    note: '投資週轉用'
  }
];
