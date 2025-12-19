
import React, { useState, useEffect } from 'react';
import { Asset, AssetType } from '../types';
import { X, Search, Loader2, Calendar, CreditCard } from 'lucide-react';
import { fetchStockPrice } from '../services/geminiService';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id'> | Asset) => void;
  initialType?: AssetType;
  editingAsset?: Asset;
}

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave, initialType, editingAsset }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    shares: 0,
    costBasis: 0,
    currentPrice: 0,
    note: '',
    repaymentDay: 1,
    monthlyRepayment: 0
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
            monthlyRepayment: 0
        });
      }
    }
  }, [isOpen, editingAsset, initialType]);

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
        alert("⚠️ 無法取得價格。");
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
    
    const payload = {
        ...formData,
        shares: (isCash || isLoan) ? 1 : Number(formData.shares),
        costBasis: Number(formData.costBasis),
        currentPrice: Number(formData.currentPrice),
        repaymentDay: isLoan ? Number(formData.repaymentDay) : undefined,
        monthlyRepayment: isLoan ? Number(formData.monthlyRepayment) : undefined,
    } as Asset;

    onSave(payload);
    onClose();
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
              onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, shares: parseFloat(e.target.value) })}
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
                  onChange={e => setFormData({ ...formData, costBasis: parseFloat(e.target.value) })}
                />
              </div>
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
                    onChange={e => setFormData({ ...formData, repaymentDay: parseInt(e.target.value) })}
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
                    onChange={e => setFormData({ ...formData, monthlyRepayment: parseFloat(e.target.value) })}
                  />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">年利率 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.costBasis}
                    onChange={e => setFormData({ ...formData, costBasis: parseFloat(e.target.value) })}
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
                onChange={e => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })}
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
