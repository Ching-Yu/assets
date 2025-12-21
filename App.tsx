
import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetType, HistoryRecord } from './types';
import { DEFAULT_USD_TWD_RATE, MOCK_INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetModal from './components/AssetModal';
import ConfirmModal from './components/ConfirmModal';
import GeminiAdvisor from './components/GeminiAdvisor';
import CompoundCalculator from './components/CompoundCalculator';
import HistoryTracker from './components/HistoryTracker';
import SettingsModal from './components/SettingsModal';
import AllocationTool from './components/AllocationTool';
import Login from './components/Login';
import { analyzePortfolioWithGemini, fetchStockPrice } from './services/geminiService';
import { Wallet, TrendingUp, Calculator, LayoutDashboard, Eye, EyeOff, History, Settings, LogOut, Cloud, Target } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut, User, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type ViewMode = 'DASHBOARD' | 'HISTORY' | 'CALCULATOR' | 'ALLOCATION';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // --- App State ---
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_USD_TWD_RATE);
  
  const [isRateLoading, setIsRateLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalType, setModalType] = useState<AssetType>(AssetType.TW_STOCK);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  
  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // View & Filter State
  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [showTwStocks, setShowTwStocks] = useState(true);
  const [showUsStocks, setShowUsStocks] = useState(true);

  // --- Auth & Data Fetching Effect ---
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
        console.error("Redirect login result error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setDataLoading(true);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setAssets(data.assets || []);
            setHistory(data.history || []);
            setExchangeRate(data.exchangeRate || DEFAULT_USD_TWD_RATE);
            if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
          } else {
            setAssets(MOCK_INITIAL_DATA as Asset[]);
            setHistory([]);
            await setDoc(docRef, {
              assets: MOCK_INITIAL_DATA,
              history: [],
              exchangeRate: DEFAULT_USD_TWD_RATE
            });
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setDataLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Cloud Sync Effect (Auto-save) ---
  useEffect(() => {
    if (!user || dataLoading) return;
    const saveData = async () => {
        try {
            await setDoc(doc(db, "users", user.uid), {
                assets,
                history,
                exchangeRate,
                aiAnalysis,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [assets, history, exchangeRate, aiAnalysis, user, dataLoading]);

  // --- Automatic Loan Repayment Check ---
  useEffect(() => {
    if (dataLoading || assets.length === 0) return;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = today.getDate();

    let hasChanges = false;
    const updatedAssets = assets.map(asset => {
        if (asset.type === AssetType.LOAN_TWD && asset.repaymentDay && asset.monthlyRepayment) {
            // Check if today is repayment day or later AND we haven't processed this month yet
            if (currentDay >= asset.repaymentDay && asset.lastRepaymentMonth !== currentMonthKey) {
                const newPrice = Math.max(0, asset.currentPrice - asset.monthlyRepayment);
                hasChanges = true;
                return {
                    ...asset,
                    currentPrice: newPrice,
                    lastRepaymentMonth: currentMonthKey
                };
            }
        }
        return asset;
    });

    if (hasChanges) {
        setAssets(updatedAssets);
        console.log("Auto-repayment processed for some loans.");
    }
  }, [dataLoading, assets.length]); // Intentionally limited trigger to prevent infinite loops

  // Fetch Exchange Rate on mount
  useEffect(() => {
    const fetchRate = async () => {
        setIsRateLoading(true);
        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            if (data?.rates?.TWD) setExchangeRate(data.rates.TWD);
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error);
        } finally {
            setIsRateLoading(false);
        }
    };
    fetchRate();
  }, []);

  // --- Automatic History Snapshot Logic ---
  useEffect(() => {
      if (dataLoading) return;
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const hasRecord = history.some(r => r.date === currentMonthKey);
      
      if (!hasRecord && assets.length > 0) {
          let totalAssets = 0;
          let totalLiabilities = 0;
          assets.forEach(asset => {
               const val = asset.type.includes('US') 
                    ? (asset.type.includes('CASH') ? asset.currentPrice : (asset.shares * asset.currentPrice)) * exchangeRate 
                    : (asset.type.includes('STOCK') ? (asset.shares * asset.currentPrice) : asset.currentPrice);
               if (asset.type === AssetType.LOAN_TWD) totalLiabilities += val;
               else totalAssets += val;
          });
          const newRecord: HistoryRecord = {
              id: crypto.randomUUID(),
              date: currentMonthKey,
              totalAssets,
              totalLiabilities,
              netWorth: totalAssets - totalLiabilities,
              note: '自動建立'
          };
          setHistory(prev => [...prev, newRecord]);
      }
  }, [history.length, dataLoading, assets, exchangeRate]);

  // --- Derived State (Filtering) ---
  const filteredAssets = useMemo(() => {
      return assets.filter(asset => {
          if (asset.type === AssetType.TW_STOCK && !showTwStocks) return false;
          if (asset.type === AssetType.US_STOCK && !showUsStocks) return false;
          return true;
      });
  }, [assets, showTwStocks, showUsStocks]);

  const currentNetWorth = useMemo(() => {
      let totalAssets = 0;
      let totalLoans = 0;
      filteredAssets.forEach(asset => {
          const val = asset.type.includes('US') 
            ? (asset.type.includes('CASH') ? asset.currentPrice : (asset.shares * asset.currentPrice)) * exchangeRate 
            : (asset.type.includes('STOCK') ? (asset.shares * asset.currentPrice) : asset.currentPrice);
          if (asset.type === AssetType.LOAN_TWD) totalLoans += val;
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

  const handleDeleteClick = (id: string) => setDeleteId(id);
  const confirmDelete = () => {
      if (deleteId) {
          setAssets(prev => prev.filter(a => a.id !== deleteId));
          setDeleteId(null);
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
        if (data?.rates?.TWD) setExchangeRate(data.rates.TWD);
      } catch (error) {
          alert('無法更新匯率。');
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
                  if (newPrice && newPrice > 0) return { ...asset, currentPrice: newPrice };
              }
              return asset;
          }));
          setAssets(updatedAssets);
      } catch (error) {
          console.error("Failed to update prices", error);
      } finally {
          setIsUpdatingPrices(false);
      }
  };
  
  const handleImportData = async (data: any) => {
      if (data.assets) setAssets(data.assets);
      if (data.history) setHistory(data.history);
      if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      alert('資料已匯入！');
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
          setAssets([]);
          setHistory([]);
          setUser(null);
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  if (authLoading) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <div className="animate-spin text-indigo-500"><Settings size={32} /></div>
          </div>
      );
  }

  if (!user) return <Login />;

  if (dataLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
            <div className="animate-spin text-indigo-500"><Cloud size={40} /></div>
            <p className="text-slate-400">正在同步雲端資料...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen pb-20">
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between h-auto md:h-16 py-2 md:py-0 gap-3">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg"><Wallet className="text-white" size={20} /></div>
                    <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">WealthFolio</h1>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    {(['DASHBOARD', 'HISTORY', 'ALLOCATION', 'CALCULATOR'] as ViewMode[]).map(v => (
                        <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition whitespace-nowrap ${view === v ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                            {v === 'DASHBOARD' ? <LayoutDashboard size={14} /> : v === 'HISTORY' ? <History size={14} /> : v === 'ALLOCATION' ? <Target size={14} /> : <Calculator size={14} />}
                            {v === 'DASHBOARD' ? '總覽' : v === 'HISTORY' ? '歷史' : v === 'ALLOCATION' ? '規劃' : '試算'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
                 {view === 'DASHBOARD' && (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700/50">
                        <button onClick={() => setShowTwStocks(!showTwStocks)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${showTwStocks ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                            {showTwStocks ? <Eye size={14} /> : <EyeOff size={14} />} 台股
                        </button>
                        <button onClick={() => setShowUsStocks(!showUsStocks)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${showUsStocks ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                            {showUsStocks ? <Eye size={14} /> : <EyeOff size={14} />} 美股
                        </button>
                    </div>
                 )}
                 <button onClick={handleUpdateAllPrices} disabled={isUpdatingPrices} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/20 transition disabled:opacity-50">
                     <TrendingUp size={14} className={isUpdatingPrices ? 'animate-spin' : ''} />
                     <span className="text-xs font-semibold hidden lg:inline">{isUpdatingPrices ? '更新中' : '更新股價'}</span>
                 </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition"><Settings size={18} /></button>
                <button onClick={handleLogout} className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-rose-900/50 hover:text-rose-400 transition"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {view === 'DASHBOARD' && (
            <>
                <GeminiAdvisor analysis={aiAnalysis} loading={isAiLoading} onAnalyze={handleAnalyze} hasAssets={filteredAssets.length > 0} />
                <Dashboard assets={filteredAssets} exchangeRate={exchangeRate} />
                <div className="grid grid-cols-1 gap-8">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AssetList typeFilter="STOCKS" assets={filteredAssets} exchangeRate={exchangeRate} onAdd={handleAddAsset} onDelete={handleDeleteClick} onEdit={handleEditAsset} />
                        <AssetList typeFilter="CASH" assets={filteredAssets} exchangeRate={exchangeRate} onAdd={handleAddAsset} onDelete={handleDeleteClick} onEdit={handleEditAsset} />
                     </div>
                     <AssetList typeFilter="LIABILITIES" assets={filteredAssets} exchangeRate={exchangeRate} onAdd={handleAddAsset} onDelete={handleDeleteClick} onEdit={handleEditAsset} />
                </div>
            </>
        )}
        {view === 'HISTORY' && <HistoryTracker history={history} onUpdateRecord={handleUpdateRecord} />}
        {view === 'ALLOCATION' && <AllocationTool assets={assets} exchangeRate={exchangeRate} />}
        {view === 'CALCULATOR' && <CompoundCalculator initialPrincipal={currentNetWorth > 0 ? currentNetWorth : 0} />}
      </main>

      <AssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAsset} 
        onDelete={handleDeleteClick}
        initialType={modalType} 
        editingAsset={editingAsset} 
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} onRefreshRate={handleRefreshRate} isRateLoading={isRateLoading} assets={assets} history={history} onImportData={handleImportData} />
      <ConfirmModal isOpen={!!deleteId} title="確認刪除" message="您確定要刪除這個項目嗎？此動作無法復原。" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default App;
