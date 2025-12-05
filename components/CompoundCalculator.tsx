import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface CompoundCalculatorProps {
  initialPrincipal: number;
}

const CompoundCalculator: React.FC<CompoundCalculatorProps> = ({ initialPrincipal }) => {
  const [principal, setPrincipal] = useState(initialPrincipal);
  const [rate, setRate] = useState(7); // default 7% annual return
  const [years, setYears] = useState(10); // default 10 years

  // Update internal principal when the prop changes (e.g. user toggles visibility of assets)
  // But only if the user hasn't heavily modified it? 
  // For better UX in this specific app context, we sync it to let user see "What if my CURRENT portfolio grows".
  useEffect(() => {
    setPrincipal(initialPrincipal);
  }, [initialPrincipal]);

  const calculationResult = useMemo(() => {
    const data = [];
    let currentAmount = principal;

    for (let year = 0; year <= years; year++) {
      data.push({
        year: year,
        amount: Math.round(currentAmount),
        formatted: Math.round(currentAmount).toLocaleString()
      });
      // FV = PV * (1 + r)
      currentAmount = currentAmount * (1 + rate / 100);
    }

    return {
      data,
      finalValue: data[data.length - 1].amount,
      totalGrowth: data[data.length - 1].amount - principal
    };
  }, [principal, rate, years]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in zoom-in duration-300">
      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Calculator size={24} />
            <h2 className="text-xl font-bold text-white">參數設定</h2>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    初始本金 (NT$)
                </label>
                <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="number" 
                        value={principal}
                        onChange={(e) => setPrincipal(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-lg"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">已自動帶入您目前的證券資產總值</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    預期年化報酬率 (%)
                </label>
                <div className="relative">
                    <TrendingUp size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="number" 
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-lg"
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                    <span>保守 (4%)</span>
                    <span>大盤 (7-10%)</span>
                    <span>積極 (15%+)</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={rate} 
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full mt-2 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    投資年限 (年)
                </label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="number" 
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-lg"
                    />
                </div>
                 <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={years} 
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full mt-2 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-indigo-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={150} />
             </div>
             <h3 className="text-indigo-200 text-sm font-medium mb-1">{years} 年後的資產總值</h3>
             <div className="text-4xl sm:text-5xl font-bold text-white mb-4">
                NT$ {calculationResult.finalValue.toLocaleString()}
             </div>
             <div className="flex gap-4 text-sm">
                <div className="bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-xs">原始本金</span>
                    <span className="text-white font-medium">NT$ {principal.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                     <span className="text-emerald-400 block text-xs">總獲利 (+{rate}%)</span>
                     <span className="text-emerald-300 font-medium">+NT$ {calculationResult.totalGrowth.toLocaleString()}</span>
                </div>
             </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50 flex-1 min-h-[300px] flex flex-col">
             <h3 className="text-white font-bold mb-4">資產成長曲線</h3>
             <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calculationResult.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="year" 
                            stroke="#94a3b8" 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: '年份', position: 'insideBottomRight', offset: -5, fill: '#64748b' }}
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8' }}
                            formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '總資產']}
                            labelFormatter={(label) => `第 ${label} 年`}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>
    </div>
  );
};

export default CompoundCalculator;