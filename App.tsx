
import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetType, HistoryRecord } from './types';
import { DEFAULT_USD_TWD_RATE, MOCK_INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetModal from './components/AssetModal';
import GeminiAdvisor from './components/GeminiAdvisor';
import CompoundCalculator from './components/CompoundCalculator';
import HistoryTracker from './components/HistoryTracker';
import { analyzePortfolioWithGemini, fetchStockPrice } from './services/geminiService';
import { Settings, WalletMinimal, RefreshCcw, TrendingUp, Calculator, LayoutDashboard, Eye, EyeOff, History, Landmark } from 'lucide-react';

type ViewMode = 'DASHBOARD' | 'HISTORY' | 'CALCULATOR';

const App: React.FC = () => {
  // --- State ---
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('wealthfolio_assets');
    return saved ? JSON.parse(saved) : (MOCK_INITIAL_DATA as Asset[]);
  });
  
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
      const saved = localStorage.getItem('wealthfolio_history');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('wealthfolio_rate');
    return saved ? parseFloat(saved) : DEFAULT_USD_TWD_RATE;
  });
  const [isRateLoading, setIsRateLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<AssetType>(AssetType.TW_STOCK);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // View & Filter State
  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [showTwStocks, setShowTwStocks] = useState(true);
  const [showUsStocks, setShowUsStocks] = useState(true);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('wealthfolio_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
      localStorage.setItem('wealthfolio_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('wealthfolio_rate', exchangeRate.toString());
  }, [exchangeRate]);

  // Fetch Exchange Rate on mount
  useEffect(() => {
    const fetchRate = async () => {
        setIsRateLoading(true);
        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            if (data && data.rates && data.rates.TWD) {
                setExchangeRate(data.rates.TWD);
            }
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error);
        } finally {
            setIsRateLoading(false);
        }
    };
    fetchRate();
  }, []);

  // --- Automatic History Snapshot Logic ---
  // Check once on mount if current month record exists
  useEffect(() => {
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const hasRecord = history.some(r => r.date === currentMonthKey);
      
      if (!hasRecord && assets.length > 0) {
          // Calculate current stats
          let totalAssets = 0;
          let totalLiabilities = 0;

          assets.forEach(asset => {
               const isLoan = asset.type === AssetType.LOAN_TWD;
               let val = 0;
               if (asset.type.includes('US')) {
                    val = (asset.type.includes('CASH') ? asset.currentPrice : (asset.shares * asset.currentPrice)) * exchangeRate;
               } else {
                    val = asset.type.includes('STOCK') ? (asset.shares * asset.currentPrice) : asset.currentPrice;
               }

               if (isLoan) {
                   totalLiabilities += val;
               } else {
                   totalAssets += val;
               }
          });

          const newRecord: HistoryRecord = {
              id: crypto.randomUUID(),
              date: currentMonthKey,
              totalAssets,
              totalLiabilities,
              netWorth: totalAssets - totalLiabilities,
              note: '自動建立 (Auto-snapshot)'
          };

          setHistory(prev => [...prev, newRecord]);
          console.log(`Auto-created history record for ${currentMonthKey}`);
      }
  }, [history.length]); // Dependency on length ensures we don't loop, but runs if history loads empty

  // --- Derived State (Filtering) ---
  const filteredAssets = useMemo(() => {
      return assets.filter(asset => {
          if (asset.type === AssetType.TW_STOCK && !showTwStocks) return false;
          if (asset.type === AssetType.US_STOCK && !showUsStocks) return false;
          return true;
      });
  }, [assets, showTwStocks, showUsStocks]);

  // Calculate Total Net Worth for the Calculator
  const currentNetWorth = useMemo(() => {
      let totalAssets = 0;
      let totalLoans = 0;
      filteredAssets.forEach(asset => {
          const isLoan = asset.type === AssetType.LOAN_TWD;
          let val = 0;
          if (asset.type.includes('US')) {
              val = (asset.type.includes('CASH') ? asset.currentPrice : (asset.shares * asset.currentPrice)) * exchangeRate;
          } else {
              val = asset.type.includes('STOCK') ? (asset.shares * asset.currentPrice) : asset.currentPrice;
          }
          if (isLoan) totalLoans += val;
          else totalAssets += val;
      });
      return totalAssets - totalLoans;
  }, [filteredAssets, exchangeRate]);

  // --- Handlers ---
  const handleAddAsset = (type: AssetType) => {
    setEditingAsset(undefined);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setModalType(asset.type);
    setIsModalOpen(true);
  };

  const handleSaveAsset = (assetData: Asset | Omit<Asset, 'id'>) => {
    if ('id' in assetData) {
      setAssets(prev => prev.map(a => a.id === assetData.id ? assetData : a));
    } else {
      const newAsset: Asset = { ...assetData, id: crypto.randomUUID() };
      setAssets(prev => [...prev, newAsset]);
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (window.confirm('確定要刪除此項目嗎？')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleUpdateRecord = (updatedRecord: HistoryRecord) => {
      setHistory(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleAnalyze = async () => {
    if (filteredAssets.length === 0) return;
    setIsAiLoading(true);
    try {
        const result = await analyzePortfolioWithGemini(filteredAssets, exchangeRate);
        setAiAnalysis(result);
    } catch (e) {
        setAiAnalysis("分析失敗。");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleRefreshRate = async () => {
      setIsRateLoading(true);
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.TWD) {
            setExchangeRate(data.rates.TWD);
        }
      } catch (error) {
          alert('無法更新匯率，請檢查網路連線。');
      } finally {
          setIsRateLoading(false);
      }
  };

  const handleUpdateAllPrices = async () => {
      setIsUpdatingPrices(true);
      try {
          const updatedAssets = await Promise.all(assets.map(async (asset) => {
              if (asset.type === AssetType.TW_STOCK || asset.type === AssetType.US_STOCK) {
                  const newPrice = await fetchStockPrice(asset.name, asset.type);
                  if (newPrice !== null && newPrice > 0) {
                      return { ...asset, currentPrice: newPrice };
                  }
              }
              return asset;
          }));
          setAssets(updatedAssets);
      } catch (error) {
          console.error("Failed to update all prices", error);
      } finally {
          setIsUpdatingPrices(false);
      }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between h-auto md:h-16 py-2 md:py-0 gap-3">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <WalletMinimal className="text-white" size={20} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">WealthFolio</h1>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setView('DASHBOARD')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition whitespace-nowrap ${view === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutDashboard size={14} />
                        總覽
                    </button>
                    <button 
                        onClick={() => setView('HISTORY')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition whitespace-nowrap ${view === 'HISTORY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <History size={14} />
                        歷史
                    </button>
                    <button 
                        onClick={() => setView('CALCULATOR')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition whitespace-nowrap ${view === 'CALCULATOR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Calculator size={14} />
                        試算
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
                 {/* Filters */}
                 {view === 'DASHBOARD' && (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700/50">
                        <button 
                            onClick={() => setShowTwStocks(!showTwStocks)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${showTwStocks ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title={showTwStocks ? "隱藏台股" : "顯示台股"}
                        >
                            {showTwStocks ? <Eye size={14} /> : <EyeOff size={14} />}
                            台股
                        </button>
                        <button 
                            onClick={() => setShowUsStocks(!showUsStocks)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${showUsStocks ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title={showUsStocks ? "隱藏美股" : "顯示美股"}
                        >
                            {showUsStocks ? <Eye size={14} /> : <EyeOff size={14} />}
                            美股
                        </button>
                    </div>
                 )}

                 <button 
                    onClick={handleUpdateAllPrices}
                    disabled={isUpdatingPrices}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/20 transition disabled:opacity-50"
                  >
                     <TrendingUp size={14} className={isUpdatingPrices ? 'animate-spin' : ''} />
                     <span className="text-xs font-semibold hidden lg:inline">{isUpdatingPrices ? '更新中...' : '更新股價'}</span>
                 </button>

                <div className="flex-shrink-0 flex items-center gap-4 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                   <Settings size={14} className="text-slate-400" />
                   <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-xs font-semibold text-slate-500 uppercase hidden lg:inline">匯率</span>
                      <div className="relative group">
                        <input 
                            type="number" 
                            value={exchangeRate} 
                            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent text-right font-mono border-b border-slate-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleRefreshRate} 
                        disabled={isRateLoading}
                        className={`text-slate-400 hover:text-white transition ${isRateLoading ? 'animate-spin' : ''}`}
                        title="更新匯率"
                      >
                          <RefreshCcw size={14} />
                      </button>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {view === 'DASHBOARD' && (
            <>
                {/* Advisor Section */}
                <GeminiAdvisor 
                    analysis={aiAnalysis} 
                    loading={isAiLoading} 
                    onAnalyze={handleAnalyze} 
                    hasAssets={filteredAssets.length > 0}
                />

                {/* Dashboard Section */}
                <Dashboard assets={filteredAssets} exchangeRate={exchangeRate} />

                {/* Asset Lists */}
                <div className="grid grid-cols-1 gap-8">
                     {/* Row 1: Stocks & Cash */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AssetList 
                            typeFilter="STOCKS" 
                            assets={filteredAssets} 
                            exchangeRate={exchangeRate}
                            onAdd={handleAddAsset}
                            onDelete={handleDeleteAsset}
                            onEdit={handleEditAsset}
                        />
                         <AssetList 
                            typeFilter="CASH" 
                            assets={filteredAssets} 
                            exchangeRate={exchangeRate}
                            onAdd={handleAddAsset}
                            onDelete={handleDeleteAsset}
                            onEdit={handleEditAsset}
                        />
                     </div>

                     {/* Row 2: Liabilities */}
                     <AssetList 
                        typeFilter="LIABILITIES" 
                        assets={filteredAssets} 
                        exchangeRate={exchangeRate}
                        onAdd={handleAddAsset}
                        onDelete={handleDeleteAsset}
                        onEdit={handleEditAsset}
                    />
                </div>
            </>
        )}

        {view === 'HISTORY' && (
             <HistoryTracker history={history} onUpdateRecord={handleUpdateRecord} />
        )}

        {view === 'CALCULATOR' && (
            <CompoundCalculator initialPrincipal={currentNetWorth > 0 ? currentNetWorth : 0} />
        )}

      </main>

      {/* Modals */}
      <AssetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAsset}
        initialType={modalType}
        editingAsset={editingAsset}
      />
    </div>
  );
};

export default App;
