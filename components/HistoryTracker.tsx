
import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Calendar, Edit2, Save, X } from 'lucide-react';

interface HistoryTrackerProps {
  history: HistoryRecord[];
  onUpdateRecord: (record: HistoryRecord) => void;
}

const HistoryTracker: React.FC<HistoryTrackerProps> = ({ history, onUpdateRecord }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HistoryRecord>>({});

  // Sort history by date ascending for chart
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

  const startEdit = (record: HistoryRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm.totalAssets !== undefined && editForm.totalLiabilities !== undefined) {
      const netWorth = Number(editForm.totalAssets) - Number(editForm.totalLiabilities);
      onUpdateRecord({
        ...editForm as HistoryRecord,
        netWorth: netWorth
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Chart Section */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-400" />
            資產淨值趨勢 (Net Worth Trend)
        </h2>
        
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sortedHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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
                            if (name === 'netWorth') return [`NT$ ${value.toLocaleString()}`, '淨資產'];
                            if (name === 'totalAssets') return [`NT$ ${value.toLocaleString()}`, '總資產'];
                            return [value, name];
                        }}
                    />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey="netWorth" 
                        name="netWorth"
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorNet)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
             <h3 className="text-lg font-bold text-white">每月紀錄明細</h3>
             <p className="text-sm text-slate-400">每月1號自動紀錄，您也可手動修正當月數據。</p>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                        <th className="p-4 font-medium">月份</th>
                        <th className="p-4 font-medium text-right">總資產</th>
                        <th className="p-4 font-medium text-right">總負債</th>
                        <th className="p-4 font-medium text-right">淨資產</th>
                        <th className="p-4 font-medium text-right w-24">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm text-white">
                    {sortedHistory.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">尚無歷史資料</td></tr>
                    ) : (
                        [...sortedHistory].reverse().map((record) => (
                            <tr key={record.id} className="hover:bg-slate-700/30">
                                <td className="p-4 font-mono">{record.date}</td>
                                
                                {editingId === record.id ? (
                                    <>
                                        <td className="p-4 text-right">
                                            <input 
                                                type="number" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right w-32 text-white"
                                                value={editForm.totalAssets}
                                                onChange={(e) => setEditForm({...editForm, totalAssets: Number(e.target.value)})}
                                            />
                                        </td>
                                        <td className="p-4 text-right">
                                            <input 
                                                type="number" 
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right w-32 text-white"
                                                value={editForm.totalLiabilities}
                                                onChange={(e) => setEditForm({...editForm, totalLiabilities: Number(e.target.value)})}
                                            />
                                        </td>
                                        <td className="p-4 text-right text-slate-500">
                                            (自動計算)
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={saveEdit} className="text-emerald-400 hover:bg-slate-600 p-1.5 rounded"><Save size={16}/></button>
                                            <button onClick={cancelEdit} className="text-rose-400 hover:bg-slate-600 p-1.5 rounded"><X size={16}/></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 text-right">NT$ {record.totalAssets.toLocaleString()}</td>
                                        <td className="p-4 text-right text-rose-300">NT$ {record.totalLiabilities.toLocaleString()}</td>
                                        <td className="p-4 text-right font-bold text-indigo-300">NT$ {record.netWorth.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => startEdit(record)}
                                                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-600 rounded transition"
                                            >
                                                <Edit2 size={16} />
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

export default HistoryTracker;
