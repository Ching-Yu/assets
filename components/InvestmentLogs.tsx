
import React, { useState, useMemo } from 'react';
import { InvestmentRecord, Asset } from '../types';
import { PiggyBank, Plus, Trash2, Calendar, DollarSign, Tag, ChevronRight } from 'lucide-react';

interface InvestmentLogsProps {
  investments: InvestmentRecord[];
  assets: Asset[];
  onAdd: (record: Omit<InvestmentRecord, 'id'>) => void;
  onDelete: (id: string) => void;
  exchangeRate: number;
}

const InvestmentLogs: React.FC<InvestmentLogsProps> = ({ investments, assets, onAdd, onDelete, exchangeRate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 7), // YYYY-MM
    assetName: '',
    amount: '',
    currency: 'TWD' as 'TWD' | 'USD',
    note: ''
  });

  const groupedInvestments = useMemo(() => {
    const groups: Record<string, InvestmentRecord[]> = {};
    investments.forEach(inv => {
      if (!groups[inv.date]) groups[inv.date] = [];
      groups[inv.date].push(inv);
    });
    // Sort keys descending (newest month first)
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(month => ({
      month,
      records: groups[month],
      totalTwd: groups[month].reduce((sum, r) => sum + (r.currency === 'USD' ? r.amount * exchangeRate : r.amount), 0)
    }));
  }, [investments, exchangeRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetName || !formData.amount) return;
    
    onAdd({
      date: formData.date,
      assetName: formData.assetName,
      amount: Number(formData.amount),
      currency: formData.currency,
      note: formData.note
    });
    
    setIsAdding(false);
    setFormData(prev => ({ ...prev, amount: '', note: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                    <PiggyBank size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">定期投入紀錄</h2>
                    <p className="text-xs text-slate-400">記錄每月本金投入，此處紀錄不影響資產總覽市值</p>
                </div>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 font-medium"
            >
                {isAdding ? '取消' : <><Plus size={18} /> 新增投入</>}
            </button>
        </div>

        {isAdding && (
            <form onSubmit={handleSubmit} className="bg-slate-900/50 p-6 rounded-xl border border-indigo-500/30 mb-8 animate-in zoom-in-95 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">投入月份</label>
                        <input 
                            type="month"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">投資標的</label>
                        <div className="relative">
                            <input 
                                type="text"
                                list="asset-suggestions"
                                placeholder="例如: 2330, VOO, 定期定額"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.assetName}
                                onChange={e => setFormData({...formData, assetName: e.target.value})}
                            />
                            <datalist id="asset-suggestions">
                                {assets.map(a => <option key={a.id} value={a.name} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">金額</label>
                        <div className="flex gap-2">
                            <select 
                                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                                value={formData.currency}
                                onChange={e => setFormData({...formData, currency: e.target.value as any})}
                            >
                                <option value="TWD">TWD</option>
                                <option value="USD">USD</option>
                            </select>
                            <input 
                                type="number"
                                required
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="輸入投入金額"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">備註</label>
                        <input 
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="選填"
                            value={formData.note}
                            onChange={e => setFormData({...formData, note: e.target.value})}
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition">
                    儲存紀錄
                </button>
            </form>
        )}

        <div className="space-y-8">
            {groupedInvestments.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                    <PiggyBank size={48} className="mx-auto text-slate-600 mb-3 opacity-20" />
                    <p className="text-slate-500">尚無投入紀錄，開始規劃您的紀律投資吧！</p>
                </div>
            ) : (
                groupedInvestments.map(group => (
                    <div key={group.month} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-slate-300 font-bold flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-400" />
                                {group.month.replace('-', ' 年 ')} 月
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">
                                當月總投入: NT$ {group.totalTwd.toLocaleString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {group.records.map(record => (
                                <div key={record.id} className="bg-slate-900/40 hover:bg-slate-700/30 transition-colors p-4 rounded-xl border border-slate-700/50 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">{record.assetName}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                {record.note || '定期投資紀錄'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-white font-mono font-bold">
                                                {record.currency === 'USD' ? 'US$' : 'NT$'} {record.amount.toLocaleString()}
                                            </div>
                                            {record.currency === 'USD' && (
                                                <div className="text-[10px] text-slate-500 italic">
                                                    ≈ NT$ {(record.amount * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => onDelete(record.id)}
                                            className="text-slate-600 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition lg:opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
      
      <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
              <ChevronRight size={20} />
          </div>
          <div className="text-sm text-slate-400 leading-relaxed">
              <strong className="text-indigo-300 block mb-1">關於投入紀錄</strong>
              此功能主要用於追蹤您的「儲蓄率」與「投資紀律」。資產總覽中建議手動更新最新股數與市值，以便更準確反映目前的淨資產狀況。
          </div>
      </div>
    </div>
  );
};

export default InvestmentLogs;
