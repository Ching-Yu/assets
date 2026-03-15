
export const DEFAULT_USD_TWD_RATE = 32.5;

export const ASSET_COLORS = {
  TW_STOCK: '#10b981', // emerald-500
  US_STOCK: '#3b82f6', // blue-500
  CASH: '#f59e0b',     // amber-500
  LOAN: '#f43f5e',     // rose-500
};

export const MOCK_INITIAL_DATA = [
  {
    id: '1',
    type: 'TW_STOCK',
    name: '2330 台積電',
    shares: 1000,
    costBasis: 600,
    currentPrice: 1450, 
    note: 'Long term hold'
  },
  {
    id: '2',
    type: 'US_STOCK',
    name: 'NVDA',
    shares: 20,
    costBasis: 450,
    currentPrice: 181.46,
    note: 'AI play'
  },
  {
    id: '3',
    type: 'US_STOCK',
    name: 'VOO',
    shares: 15,
    costBasis: 380,
    currentPrice: 520,
    note: 'S&P 500 ETF'
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
