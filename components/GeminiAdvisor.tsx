import React, { useState } from 'react';
import { Brain, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GeminiAdvisorProps {
  analysis: string;
  loading: boolean;
  onAnalyze: () => void;
  hasAssets: boolean;
}

const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ analysis, loading, onAnalyze, hasAssets }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true); // Automatically expand when analyzing
    onAnalyze();
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-900/40 to-slate-800 border border-indigo-500/30 rounded-2xl shadow-xl transition-all duration-300 ${isExpanded ? 'p-6' : 'p-4 cursor-pointer hover:bg-slate-800/80'}`} onClick={!isExpanded ? handleToggle : undefined}>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className={`p-2 bg-indigo-500/20 rounded-lg text-indigo-400 transition-colors ${loading ? 'animate-pulse' : ''}`}>
                 <Brain size={20} />
            </div>
            <div>
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Gemini 投資顧問
                    {!isExpanded && hasAssets && analysis && <span className="text-xs font-normal text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">分析已就緒</span>}
                 </h3>
                 {!isExpanded && <p className="text-xs text-indigo-300">點擊展開以查看 AI 分析報告</p>}
                 {isExpanded && <p className="text-xs text-indigo-300">智慧分析資產配置與風險</p>}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button
              onClick={handleAnalyzeClick}
              disabled={loading || !hasAssets}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                loading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : !hasAssets 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
              {loading ? '分析中...' : '重新分析'}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                className="text-slate-400 hover:text-white transition-colors p-1"
            >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/50 rounded-xl p-5 min-h-[120px] border border-slate-700/50">
                {!hasAssets ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2 py-4">
                        <AlertCircle size={24} />
                        <p>請先新增資產以獲取 AI 建議。</p>
                    </div>
                ) : !analysis ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2 py-4">
                        <Brain size={24} className="opacity-50" />
                        <p>點擊「重新分析」獲取 Gemini 專業見解。</p>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                )}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 text-right">
                * AI 分析僅供參考，不構成投資建議。
            </div>
        </div>
      )}
    </div>
  );
};

export default GeminiAdvisor;