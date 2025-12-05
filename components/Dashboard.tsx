
import React, { useMemo } from 'react';
import { Asset, AssetType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Wallet, Globe, ArrowDownCircle, Activity, Landmark } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
  exchangeRate: number;
}

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
];

const Dashboard: React.FC<DashboardProps> = ({ assets, exchangeRate }) => {
  const summary = useMemo(() => {
    let twStockVal = 0;
    let usStockVal = 0;
    let cashVal = 0;
    let loanVal = 0;
    
    // Calculate total values by category
    assets.forEach(asset => {
      const val = (asset.type.includes('US') ? (asset.shares * asset.currentPrice) * exchangeRate : (asset.shares * asset.currentPrice));
      
      if (asset.type === AssetType.TW_STOCK) {
        twStockVal += val;
      } else if (asset.type === AssetType.US_STOCK) {
        usStockVal += val;
      } else if (asset.type === AssetType.CASH_TWD || asset.type === AssetType.CASH_USD) {
        // Correctly handle cash values (shares usually 1, but safeguard calculation)
        const cashAmt = asset.type === AssetType.CASH_USD ? asset.currentPrice * exchangeRate : asset.currentPrice;
        cashVal += cashAmt;
      } else if (asset.type === AssetType.LOAN_TWD) {
        loanVal += asset.currentPrice;
      }
    });

    const totalAssets = twStockVal + usStockVal + cashVal;
    const netWorth = totalAssets - loanVal;

    // Prepare data for individual asset allocation pie chart (Assets Only)
    const assetData = assets
        .filter(a => a.type !== AssetType.LOAN_TWD)
        .map(asset => {
            let val = 0;
            if (asset.type.includes('CASH') || asset.type.includes('LOAN')) {
                 val = asset.currentPrice;
            } else {
                 val = asset.shares * asset.currentPrice;
            }
            
            if (asset.type.includes('US')) {
                val *= exchangeRate;
            }
            return {
                name: asset.name,
                value: val,
            };
        })
        .sort((a, b) => b.value - a.value);

    return {
      totalAssetsTwd: totalAssets,
      totalLiabilitiesTwd: loanVal,
      netWorthTwd: netWorth,
      netWorthUsd: exchangeRate > 0 ? netWorth / exchangeRate : 0,
      debtRatio: totalAssets > 0 ? (loanVal / totalAssets) * 100 : 0,
      categoryAllocation: [
         { name: '台股', value: twStockVal },
         { name: '美股', value: usStockVal },
         { name: '現金', value: cashVal },
      ],
      assetAllocation: assetData.length > 0 ? assetData : [{ name: '無資產', value: 1 }]
    };
  }, [assets, exchangeRate]);

  const hasData = assets.filter(a => a.type !== AssetType.LOAN_TWD).length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Net Worth Hero Card */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Activity size={120} />
        </div>
        
        <div className="mb-6">
          <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">淨資產 (Net Worth)</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-bold text-white">
              NT$ {summary.netWorthTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-slate-400 mt-2 text-sm">
            ≈ US$ {summary.netWorthUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-700/50 pt-6">
             <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-lg">
                <div className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <TrendingUp size={14} /> 總資產 Assets
                </div>
                <div className="text-lg font-semibold text-emerald-100">
                    NT$ {summary.totalAssetsTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
            </div>

            <div className="bg-rose-900/20 border border-rose-500/20 p-3 rounded-lg">
                <div className="text-rose-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <ArrowDownCircle size={14} /> 總負債 Liabilities
                </div>
                <div className="text-lg font-semibold text-rose-100">
                    NT$ {summary.totalLiabilitiesTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
            </div>
            
            <div className="bg-slate-700/30 p-3 rounded-lg flex flex-col justify-center">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">負債比 (Debt Ratio)</span>
                    <span className={`text-xs font-bold ${summary.debtRatio > 50 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {summary.debtRatio.toFixed(1)}%
                    </span>
                 </div>
                 <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full ${summary.debtRatio > 50 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${Math.min(summary.debtRatio, 100)}%` }}
                    ></div>
                 </div>
            </div>
        </div>
      </div>

      {/* Allocation Chart */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center relative">
        <h3 className="text-slate-300 font-semibold mb-4 w-full text-left flex items-center gap-2">
            <Landmark size={18} />
            資產分布 (Assets Only)
        </h3>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summary.assetAllocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                stroke="none"
              >
                {summary.assetAllocation.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={hasData ? PIE_COLORS[index % PIE_COLORS.length] : '#334155'} 
                  />
                ))}
              </Pie>
              {hasData && (
                  <Tooltip 
                    formatter={(value: number) => `NT$ ${Math.round(value).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {!hasData && (
             <div className="absolute inset-0 flex items-center justify-center top-8 pointer-events-none">
                <span className="text-slate-500 text-sm">無資產資料</span>
             </div>
        )}

        {hasData && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center text-[10px] text-slate-400 max-h-24 overflow-y-auto w-full custom-scrollbar">
                {summary.assetAllocation.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-slate-700/30 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="truncate max-w-[80px]">{entry.name}</span>
                        <span className="opacity-70">{summary.totalAssetsTwd > 0 ? Math.round((entry.value / summary.totalAssetsTwd) * 100) : 0}%</span>
                    </div>
                    ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
