
import React, { useState, useMemo } from 'react';
import { Asset, AssetType } from '../types';
import { Target, TrendingUp, ArrowRight, CircleDollarSign, PlusCircle, MinusCircle } from 'lucide-react';

interface AllocationToolProps {
  assets: Asset[];
  exchangeRate: number;
}

const AllocationTool: React.FC<AllocationToolProps> = ({ assets, exchangeRate }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [targetPercent, setTargetPercent] = useState<number>(10);

  // Filter for only stocks (actual holdings)
  const stockAssets = useMemo(() => {
    return assets.filter(a => a.type === AssetType.TW_STOCK || a.type === AssetType.US_STOCK);
  }, [assets]);

  // Set initial selection if not set
  React.useEffect(() => {
    if (!selectedAssetId && stockAssets.length > 0) {
      setSelectedAssetId(stockAssets[0].id);
    }
  }, [stockAssets, selectedAssetId]);

  const calculation = useMemo(() => {
    // 1. Calculate Total Asset Value (Assets only, excluding loans)
    const totalAssetsTwd = assets.reduce((sum, a) => {
        if (a.type === AssetType.LOAN_TWD) return sum;
        const val = (a.type.includes('US') ? (a.shares * a.currentPrice) : (a.shares * a.currentPrice));
        const cashVal = a.type.includes('CASH') ? a.currentPrice : (a.shares * a.currentPrice);
        const twdVal = a.type.includes('US') ? cashVal * exchangeRate : cashVal;
        return sum + twdVal;
    }, 0);

    const asset = stockAssets.find(a => a.id === selectedAssetId);
    if (!asset || totalAssetsTwd === 0) return null;

    const isUs = asset.type === AssetType.US_STOCK;
    const currentValInCurrency = asset.shares * asset.currentPrice;
    const currentValInTwd = isUs ? currentValInCurrency * exchangeRate : currentValInCurrency;
    
    const currentPercent = (currentValInTwd / totalAssetsTwd) * 100;
    const targetValInTwd = totalAssetsTwd * (targetPercent / 100);
    const gapInTwd = targetValInTwd - currentValInTwd;
    
    const gapInCurrency = isUs ? gapInTwd / exchangeRate : gapInTwd;
    const requiredShares = gapInCurrency / asset.currentPrice;

    return {
      assetName: asset.name,
      symbol: isUs ? 'US$' : 'NT$',
      totalAssetsTwd,
      currentValInTwd,
      currentPercent,
      targetValInTwd,
      gapInTwd,
      gapInCurrency,
      requiredShares,
      isBuy: gapInTwd > 0
    };
  }, [assets, stockAssets, selectedAssetId, targetPercent, exchangeRate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Target size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">目標配置計算機</h2>
                <p className="text-xs text-slate-400">快速計算達到理想倉位比重所需的買入/賣出量</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">選擇標的</label>
                    <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                    >
                        {stockAssets.length === 0 ? (
                            <option value="">請先新增股票資產</option>
                        ) : (
                            stockAssets.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-400">目標佔比 (%)</label>
                        <span className="text-indigo-400 font-bold text-lg">{targetPercent}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="0.5"
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        value={targetPercent}
                        onChange={(e) => setTargetPercent(parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">總資產估計 (不含負債)</span>
                        <span className="text-white font-mono">NT$ {calculation?.totalAssetsTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">目前持有價值</span>
                        <span className="text-white font-mono">NT$ {calculation?.currentValInTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>

            {/* Result Display */}
            <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-700/30 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {!calculation ? (
                    <p className="text-slate-500">請選擇一個資產開始計算</p>
                ) : (
                    <>
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <TrendingUp size={120} />
                        </div>
                        
                        <div className="mb-6">
                            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">{calculation.assetName}</h3>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-slate-500 text-sm font-medium">當前: {calculation.currentPercent.toFixed(1)}%</span>
                                <ArrowRight size={14} className="text-slate-600" />
                                <span className="text-indigo-400 text-xl font-bold">目標: {targetPercent}%</span>
                            </div>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-3 mb-8">
                            <div 
                                className="h-3 rounded-full bg-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                style={{ width: `${Math.min(calculation.currentPercent, 100)}%` }}
                            ></div>
                            <div 
                                className="h-1 bg-white absolute top-[calc(50%-0.5px)] w-0.5" 
                                style={{ left: `${targetPercent}%` }}
                                title="目標位置"
                            ></div>
                        </div>

                        <div className={`p-6 rounded-2xl w-full flex flex-col items-center ${calculation.isBuy ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-rose-900/20 border border-rose-500/20'}`}>
                            <div className={`mb-2 flex items-center gap-2 font-bold ${calculation.isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {calculation.isBuy ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                                {calculation.isBuy ? '建議買入' : '建議減持'}
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">
                                {Math.abs(calculation.requiredShares).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg">股</span>
                            </div>
                            <div className="text-slate-400 text-sm">
                                約 {calculation.symbol} {Math.abs(calculation.gapInCurrency).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-slate-500 mt-2 font-mono italic">
                                (約 NT$ {Math.abs(calculation.gapInTwd).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3">
            <CircleDollarSign className="text-indigo-400 shrink-0" size={20} />
            <p className="text-xs text-slate-300 leading-relaxed">
                本計算機是以「目前總資產」為基準進行計算。若您是透過「投入新資金」來達成目標，所需買入的股數會更多。
            </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3">
            <TrendingUp className="text-emerald-400 shrink-0" size={20} />
            <p className="text-xs text-slate-300 leading-relaxed">
                定期調整倉位至目標比重 (Rebalancing) 有助於落實「低買高賣」的紀律，並控制整體風險。
            </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3">
            <Target className="text-amber-400 shrink-0" size={20} />
            <p className="text-xs text-slate-300 leading-relaxed">
                考慮手續費：過於頻繁的小額調整可能導致交易成本過高，建議差距超過 5% 再進行調整。
            </p>
        </div>
      </div>
    </div>
  );
};

export default AllocationTool;
