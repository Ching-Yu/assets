
import React, { useState, useEffect } from 'react';
import { Asset, AssetType, AssetSector } from '../types';
import { SECTOR_LABELS, detectSector } from '../constants';
import { X, Search, Loader2, Calendar, CreditCard, Trash2, PieChart } from 'lucide-react';
import { fetchStockPrice } from '../services/geminiService';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id'> | Asset) => void;
  onDelete?: (id: string) => void;
  initialType?: AssetType;
  editingAsset?: Asset;
}

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave, onDelete, initialType, editingAsset }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    shares: 0,
    costBasis: 0,
    currentPrice: 0,
    note: '',
    repaymentDay: 1,
    monthlyRepayment: 0,
    sector: AssetSector.OTHER
  });
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingAsset) {
        setFormData(editingAsset);
      } else {
        setFormData({
            type: initialType || AssetType.TW_STOCK,
            name: '',
            shares: 0,
            costBasis: 0,
            currentPrice: 0,
            note: '',
            repaymentDay: 1,
            monthlyRepayment: 0,
            sector: AssetSector.OTHER
        });
      }
    }
  }, [isOpen, editingAsset, initialType]);

  // Auto-detect sector when name changes (only if user hasn't manually selected one yet, or it's 'OTHER')
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      const detected = detectSector(newName);
      
      setFormData(prev => {
          // If the current sector is OTHER, or user is just typing a new entry, we auto-update
          // But if user specifically selected FINANCE, and types a name that detects as TECH, we might not want to override instantly?
          // For simplicity/UX, we override if the detected sector is NOT 'OTHER', assuming the detector is better than the default.
          // But we don't override if user is Editing an existing asset and hasn't changed the name much? 
          // Simplest: If detected is valuable (not other), update it.
          const shouldUpdateSector = detected !== AssetSector.OTHER && (!prev.sector || prev.sector === AssetSector.OTHER);
          return { 
              ...prev, 
              name: newName,
              sector: shouldUpdateSector ? detected : prev.sector
          };
      });
  };

  if (!isOpen) return null;

  const type = formData.type;
  const isCash = type?.includes('CASH');
  const isLoan = type === AssetType.LOAN_TWD;
  const isStock = !isCash && !isLoan;

  const handleFetchPrice = async () => {
    if (!formData.name || !formData.type || !isStock) return;
    setIsFetchingPrice(true);
    try {
      const price = await fetchStockPrice(formData.name, formData.type);
      if (price !== null && price > 0) {
        setFormData(prev => ({ ...prev, currentPrice: price }));
      } else {
        alert("⚠️ 無法取得價格。請確認代號是否正確。");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    // Construct payload carefully to avoid "undefined" values which Firebase rejects
    const payload: any = {
        ...formData,
        shares: (isCash || isLoan) ? 1 : Number(formData.shares || 0),
        costBasis: Number(formData.costBasis || 0),
        currentPrice: Number(formData.currentPrice || 0),
        note: formData.note || "",
        sector: formData.sector || AssetSector.OTHER
    };

    if (isLoan) {
        payload.repaymentDay = Number(formData.repaymentDay || 1);
        payload.monthlyRepayment = Number(formData.monthlyRepayment || 0);
    } else {
        // Delete keys instead of setting to undefined
        delete payload.repaymentDay;
        delete payload.monthlyRepayment;
        delete payload.lastRepaymentMonth;
    }

    onSave(payload as Asset);
    onClose();
  };
  
  const handleDelete = () => {
      if (editingAsset && onDelete) {
          onDelete(editingAsset.id);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-white">
            {editingAsset ? '編輯項目' : (isLoan ? '新增負債' : '新增資產')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              {isCash ? '帳戶名稱' : isLoan ? '貸款名稱' : '代號 / 名稱'}
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder={isCash ? "例如：XX 銀行活存" : isLoan ? "例如：XX 銀行信貸" : "例如：2330 或 AAPL"}
              value={formData.name}
              onChange={handleNameChange}
            />
          </div>

          {isStock && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">持有股數</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.shares}
                  // 使用 as any 暫存字串，避免 React 在輸入小數點時重新渲染導致小數點消失
                  onChange={e => setFormData({ ...formData, shares: e.target.value as any })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">平均成本</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.costBasis}
                  onChange={e => setFormData({ ...formData, costBasis: e.target.value as any })}
                />
              </div>
            </div>
          )}
          
          {isStock && (
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <PieChart size={14} /> 產業類別 (用於圓餅圖分析)
                </label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                    value={formData.sector || AssetSector.OTHER}
                    onChange={e => setFormData({ ...formData, sector: e.target.value as AssetSector })}
                >
                    {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
             </div>
          )}
          
          {isLoan && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
               <div className="col-span-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">自動扣款設定</div>
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar size={12} /> 每月扣款日 (1-28)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.repaymentDay}
                    onChange={e => setFormData({ ...formData, repaymentDay: e.target.value as any })}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <CreditCard size={12} /> 每月扣款金額
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.monthlyRepayment}
                    onChange={e => setFormData({ ...formData, monthlyRepayment: e.target.value as any })}
                  />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">年利率 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.costBasis}
                    onChange={e => setFormData({ ...formData, costBasis: e.target.value as any })}
                  />
               </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              {isCash ? '總金額' : isLoan ? '剩餘未還本金' : '目前市價'}
            </label>
            <div className="flex gap-2">
                <input
                type="number"
                step="any"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.currentPrice}
                onChange={e => setFormData({ ...formData, currentPrice: e.target.value as any })}
                />
                {isStock && (
                    <button 
                        type="button"
                        onClick={handleFetchPrice}
                        disabled={isFetchingPrice || !formData.name}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-lg transition"
                    >
                        {isFetchingPrice ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">備註 (選填)</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
              value={formData.note || ''}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-slate-800 py-4">
             {editingAsset && onDelete && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="p-3 rounded-lg border border-rose-900/50 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 transition flex-shrink-0"
                    title="刪除此項目"
                >
                    <Trash2 size={20} />
                </button>
             )}
             <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 rounded-lg text-white transition font-medium shadow-lg ${isLoan ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
