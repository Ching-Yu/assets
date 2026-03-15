import React, { useState, useMemo } from 'react';
import { InvestmentRecord } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Landmark, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface InvestmentTrackerProps {
  investments: InvestmentRecord[];
  onAddRecord: (record: Omit<InvestmentRecord, 'id'>) => void;
  onUpdateRecord: (record: InvestmentRecord) => void;
  onDeleteRecord: (id: string) => void;
}

const InvestmentTracker: React.FC<InvestmentTrackerProps> = ({ investments, onAddRecord, onUpdateRecord, onDeleteRecord }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<InvestmentRecord>>({ date: new Date().toISOString().split('T')[0], amount: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvestmentRecord>>({});

  const sortedInvestments = useMemo(() => {
    return [...investments].sort((a, b) => a.date.localeCompare(b.date));
  }, [investments]);

  const chartData = useMemo(() => {
    let cumulative = 0;
    return sortedInvestments.map(record => {
      cumulative += record.amount;
      return {
        date: record.date,
        amount: record.amount,
        cumulative: cumulative
      };
    });
  }, [sortedInvestments]);

  const handleAdd = () => {
    if (newForm.date && newForm.amount !== undefined) {
      onAddRecord({
        date: newForm.date,
        amount: Number(newForm.amount),
        target: newForm.target || '',
        note: newForm.note || ''
      });
      setIsAdding(false);
      setNewForm({ date: new Date().toISOString().split('T')[0], amount: 0, target: '', note: '' });
    }
  };

  const startEdit = (record: InvestmentRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const saveEdit = () => {
    if (editingId && editForm.date && editForm.amount !== undefined) {
      onUpdateRecord(editForm as InvestmentRecord);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Landmark className="text-emerald-400" />
            累積投入本金 (Cumulative Investment)
        </h2>
        
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        tickFormatter={(val) => `${(val/10000).toFixed(0)}萬`}
                        tickLine={false}
                        axisLine={false}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: number, name: string) => {
                            if (name === 'cumulative') return [`NT$ ${value.toLocaleString()}`, '累積投入'];
                            if (name === 'amount') return [`NT$ ${value.toLocaleString()}`, '單筆投入'];
                            return [value, name];
                        }}
                    />
                    <Legend />
                    <Area 
                        type="stepAfter" 
                        dataKey="cumulative" 
                        name="cumulative"
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCumulative)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
             <div>
                 <h3 className="text-lg font-bold text-white">投入紀錄明細</h3>
                 <p className="text-sm text-slate-400">記錄每次投入或取出的資金。</p>
             </div>
             <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition"
             >
                 <Plus size={16} />
                 新增紀錄
             </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                        <th className="p-4 font-medium">日期</th>
                        <th className="p-4 font-medium text-right">金額 (NT$)</th>
                        <th className="p-4 font-medium">標的 (可選)</th>
                        <th className="p-4 font-medium">備註</th>
                        <th className="p-4 font-medium text-right w-24">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm text-white">
                    {isAdding && (
                        <tr className="bg-slate-700/50">
                            <td className="p-4">
                                <input 
                                    type="date" 
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                    value={newForm.date}
                                    onChange={(e) => setNewForm({...newForm, date: e.target.value})}
                                />
                            </td>
                            <td className="p-4">
                                <input 
                                    type="number" 
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white w-full"
                                    value={newForm.amount}
                                    onChange={(e) => setNewForm({...newForm, amount: Number(e.target.value)})}
                                    placeholder="金額"
                                />
                            </td>
                            <td className="p-4">
                                <input 
                                    type="text" 
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                    value={newForm.target || ''}
                                    onChange={(e) => setNewForm({...newForm, target: e.target.value})}
                                    placeholder="例如: AAPL, 2330"
                                />
                            </td>
                            <td className="p-4">
                                <input 
                                    type="text" 
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                    value={newForm.note || ''}
                                    onChange={(e) => setNewForm({...newForm, note: e.target.value})}
                                    placeholder="備註"
                                />
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                <button onClick={handleAdd} className="text-emerald-400 hover:bg-slate-600 p-1.5 rounded"><Save size={16}/></button>
                                <button onClick={() => setIsAdding(false)} className="text-rose-400 hover:bg-slate-600 p-1.5 rounded"><X size={16}/></button>
                            </td>
                        </tr>
                    )}
                    {sortedInvestments.length === 0 && !isAdding ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">尚無投入紀錄</td></tr>
                    ) : (
                        [...sortedInvestments].reverse().map((record) => (
                            <tr key={record.id} className="hover:bg-slate-700/30">
                                {editingId === record.id ? (
                                    <>
                                        <td className="p-4">
                                            <input 
                                                type="date" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white w-full"
                                                value={editForm.amount}
                                                onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                                value={editForm.target || ''}
                                                onChange={(e) => setEditForm({...editForm, target: e.target.value})}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                                value={editForm.note || ''}
                                                onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                                            />
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={saveEdit} className="text-emerald-400 hover:bg-slate-600 p-1.5 rounded"><Save size={16}/></button>
                                            <button onClick={() => setEditingId(null)} className="text-rose-400 hover:bg-slate-600 p-1.5 rounded"><X size={16}/></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 font-mono">{record.date}</td>
                                        <td className={`p-4 text-right font-medium ${record.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {record.amount >= 0 ? '+' : ''}NT$ {record.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-slate-300">{record.target || '-'}</td>
                                        <td className="p-4 text-slate-300">{record.note}</td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => startEdit(record)}
                                                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-600 rounded transition"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('確定要刪除此紀錄嗎？')) {
                                                        onDeleteRecord(record.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-600 rounded transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTracker;
