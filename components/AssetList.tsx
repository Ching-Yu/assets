
import React, { useState, useMemo } from 'react';
import { Asset, AssetType } from '../types';
import { Trash2, Edit2, Plus, TrendingUp, TrendingDown, PieChart, Banknote } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  typeFilter: 'STOCKS' | 'CASH' | 'LIABILITIES';
  exchangeRate: number;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  onAdd: (type: AssetType) => void;
}

const AssetList: React.FC<AssetListProps> = ({ assets, typeFilter, exchangeRate, onDelete, onEdit, onAdd }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'TW' | 'US'>('ALL');

  // Calculate Total Value for % calculation
  const totalCategoryValueTwd = useMemo(() => {
    return assets.reduce((sum, asset) => {
      // Filter sum based on current list type
      const isStock = asset.type === AssetType.TW_STOCK || asset.type === AssetType.US_STOCK;
      const isCash = asset.type === AssetType.CASH_TWD || asset.type === AssetType.CASH_USD;
      const isLoan = asset.type === AssetType.LOAN_TWD;

      if (typeFilter === 'STOCKS' && !isStock) return sum;
      if (typeFilter === 'CASH' && !isCash) return sum;
      if (typeFilter === 'LIABILITIES' && !isLoan) return sum;

      let val = 0;
      if (asset.type.includes('US')) {
        val = (asset.type.includes('CASH') ? asset.currentPrice : (asset.shares * asset.currentPrice)) * exchangeRate;
      } else {
         val = asset.type.includes('STOCK') ? (asset.shares * asset.currentPrice) : asset.currentPrice;
      }
      return sum + val;
    }, 0);
  }, [assets, exchangeRate, typeFilter]);

  const filteredAssets = assets.filter(asset => {
    if (typeFilter === 'LIABILITIES') {
        return asset.type === AssetType.LOAN_TWD;
    }
    if (typeFilter === 'CASH') {
      return asset.type === AssetType.CASH_TWD || asset.type === AssetType.CASH_USD;
    }
    // Stock Logic
    if (activeTab === 'TW') return asset.type === AssetType.TW_STOCK;
    if (activeTab === 'US') return asset.type === AssetType.US_STOCK;
    return asset.type === AssetType.TW_STOCK || asset.type === AssetType.US_STOCK;
  });

  const getCurrencySymbol = (type: AssetType) => {
    return (type === AssetType.US_STOCK || type === AssetType.CASH_USD) ? 'US$' : 'NT$';
  };

  const calculateGain = (asset: Asset) => {
    if (asset.type.includes('CASH') || asset.type.includes('LOAN')) return { gain: 0, percent: 0 };
    const currentVal = asset.shares * asset.currentPrice;
    const costVal = asset.shares * asset.costBasis;
    const gain = currentVal - costVal;
    const percent = costVal > 0 ? (gain / costVal) * 100 : 0;
    return { gain, percent };
  };

  const getHeaderTitle = () => {
      switch(typeFilter) {
          case 'STOCKS': return '證券部位 (Stock Holdings)';
          case 'CASH': return '現金部位 (Cash Positions)';
          case 'LIABILITIES': return '負債/信貸 (Liabilities)';
      }
  };

  const getHeaderDesc = () => {
    switch(typeFilter) {
        case 'STOCKS': return '管理你的股票與 ETF';
        case 'CASH': return '管理你的流動資金';
        case 'LIABILITIES': return '管理信貸與其他負債';
    }
  };

  return (
    <div className={`rounded-2xl shadow-lg overflow-hidden ${typeFilter === 'LIABILITIES' ? 'bg-rose-950/20 border border-rose-900/50' : 'bg-slate-800'}`}>
      {/* Header & Tabs */}
      <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className={`text-xl font-bold mb-1 ${typeFilter === 'LIABILITIES' ? 'text-rose-100' : 'text-white'}`}>
            {getHeaderTitle()}
          </h3>
          <p className={`text-sm ${typeFilter === 'LIABILITIES' ? 'text-rose-300/70' : 'text-slate-400'}`}>{getHeaderDesc()}</p>
        </div>

        <div className="flex items-center gap-3">
            {typeFilter === 'STOCKS' && (
                <div className="bg-slate-900 p-1 rounded-lg flex text-xs font-medium">
                    {(['ALL', 'TW', 'US'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {tab === 'TW' ? '🇹🇼 台股' : tab === 'US' ? '🇺🇸 美股' : '全部'}
                        </button>
                    ))}
                </div>
            )}
            
            {typeFilter === 'CASH' && (
                <div className="flex gap-2">
                     <button onClick={() => onAdd(AssetType.CASH_TWD)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                        <Plus size={16} /> 台幣
                    </button>
                    <button onClick={() => onAdd(AssetType.CASH_USD)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                        <Plus size={16} /> 美金
                    </button>
                </div>
            )}

            {typeFilter === 'LIABILITIES' && (
                <button onClick={() => onAdd(AssetType.LOAN_TWD)} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                    <Plus size={16} /> 新增負債
                </button>
            )}

            {typeFilter === 'STOCKS' && (
                 <div className="flex gap-2">
                     <button onClick={() => onAdd(AssetType.TW_STOCK)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                        <Plus size={16} /> 台股
                    </button>
                    <button onClick={() => onAdd(AssetType.US_STOCK)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                        <Plus size={16} /> 美股
                    </button>
                </div>
            )}
           
        </div>
      </div>

      {/* List / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${typeFilter === 'LIABILITIES' ? 'bg-rose-900/30 text-rose-300' : 'bg-slate-900/50 text-slate-400'}`}>
              <th className="p-4 font-medium">項目名稱</th>
              {typeFilter === 'STOCKS' && <th className="p-4 font-medium text-right">持倉數量</th>}
              <th className="p-4 font-medium text-right">
                  {typeFilter === 'LIABILITIES' ? '剩餘餘額' : '現價 / 總值'}
              </th>
              {typeFilter === 'LIABILITIES' ? (
                   <th className="p-4 font-medium text-right">利率 (參考)</th>
              ) : (
                  <th className="p-4 font-medium text-right">佔比</th>
              )}
              {typeFilter === 'STOCKS' && <th className="p-4 font-medium text-right">未實現損益</th>}
               <th className="p-4 font-medium text-right w-24">操作</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-sm ${typeFilter === 'LIABILITIES' ? 'divide-rose-900/30' : 'divide-slate-700/50'}`}>
            {filteredAssets.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                         {typeFilter === 'LIABILITIES' ? '目前沒有負債紀錄。' : '沒有相關資產。'}
                    </td>
                </tr>
            ) : (
                filteredAssets.map(asset => {
                    const symbol = getCurrencySymbol(asset.type);
                    const gainInfo = calculateGain(asset);
                    const isPositive = gainInfo.gain >= 0;
                    
                    // Logic to handle value calculation unified
                    const isLoan = asset.type === AssetType.LOAN_TWD;
                    const isCash = asset.type.includes('CASH');
                    const rawValue = (isCash || isLoan) ? asset.currentPrice : (asset.shares * asset.currentPrice);
                    
                    const isUsAsset = (asset.type === AssetType.US_STOCK || asset.type === AssetType.CASH_USD);
                    const valueInTwd = isUsAsset ? rawValue * exchangeRate : rawValue;
                    
                    const percentOfCategory = totalCategoryValueTwd > 0 
                        ? (valueInTwd / totalCategoryValueTwd) * 100 
                        : 0;
                    
                    return (
                    <tr key={asset.id} className={`transition-colors group ${typeFilter === 'LIABILITIES' ? 'hover:bg-rose-900/20' : 'hover:bg-slate-700/30'}`}>
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${
                                asset.type === AssetType.TW_STOCK ? 'bg-emerald-500' : 
                                asset.type === AssetType.US_STOCK ? 'bg-blue-500' : 
                                asset.type === AssetType.LOAN_TWD ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></div>
                            <div>
                                <div className="font-semibold text-white">{asset.name}</div>
                                <div className="text-xs text-slate-400">
                                    {asset.note || (asset.type.includes('US') ? '美股' : asset.type.includes('TW') ? '台股' : isLoan ? '負債' : '現金')}
                                </div>
                            </div>
                        </div>
                        </td>
                        {typeFilter === 'STOCKS' && (
                            <td className="p-4 text-right">
                                <div className="text-white">{asset.shares.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">均價: {symbol}{asset.costBasis.toLocaleString()}</div>
                            </td>
                        )}
                        <td className="p-4 text-right">
                            <div className={`font-medium ${isLoan ? 'text-rose-300' : 'text-white'}`}>
                                {symbol}{rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                             {typeFilter === 'STOCKS' && (
                                <div className="text-xs text-slate-500">
                                   現價: {asset.currentPrice.toLocaleString()}
                                </div>
                             )}
                             {isUsAsset && (
                                 <div className="text-xs text-slate-400 mt-0.5">
                                     ≈ NT${Math.round(valueInTwd).toLocaleString()}
                                 </div>
                             )}
                        </td>
                        
                         <td className="p-4 text-right">
                            {isLoan ? (
                                <div className="text-slate-400">
                                    {asset.costBasis}%
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-1 text-indigo-300 font-medium">
                                    <PieChart size={12} />
                                    {percentOfCategory.toFixed(1)}%
                                </div>
                            )}
                        </td>

                        {typeFilter === 'STOCKS' && (
                            <td className="p-4 text-right">
                                <div className={`flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                    {Math.abs(gainInfo.percent).toFixed(2)}%
                                </div>
                                <div className={`text-xs ${isPositive ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                    {isPositive ? '+' : '-'}{symbol}{Math.abs(gainInfo.gain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </td>
                        )}
                        <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onEdit(asset); }} 
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }} 
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-600 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetList;
