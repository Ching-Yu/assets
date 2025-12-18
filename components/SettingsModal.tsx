
import React, { useState, useRef } from 'react';
import { Asset, HistoryRecord } from '../types';
import { X, Download, Upload, Copy, Check, RefreshCcw, AlertTriangle, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  onRefreshRate: () => void;
  isRateLoading: boolean;
  assets: Asset[];
  history: HistoryRecord[];
  onImportData: (data: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  exchangeRate,
  setExchangeRate,
  onRefreshRate,
  isRateLoading,
  assets,
  history,
  onImportData
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'DATA'>('GENERAL');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Export Logic ---
  const handleExport = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      exchangeRate,
      assets,
      history
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    const data = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        exchangeRate,
        assets,
        history
      };
    const jsonString = JSON.stringify(data);
    navigator.clipboard.writeText(jsonString).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // --- Import Logic ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        setImportJson(json);
        validateAndImport(json);
      } catch (err) {
        setImportError('無法讀取檔案，請確認格式正確。');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextImport = () => {
      validateAndImport(importJson);
  };

  const validateAndImport = (jsonString: string) => {
      try {
          const data = JSON.parse(jsonString);
          if (!data.assets || !Array.isArray(data.assets)) {
              throw new Error("無效的資料格式：找不到資產資料 (Assets)");
          }
          // Basic validation passed
          if (confirm(`確認匯入資料？\n\n這將會覆蓋目前的設定：\n- ${data.assets.length} 筆資產\n- ${data.history?.length || 0} 筆歷史紀錄`)) {
              onImportData(data);
              onClose();
              alert("資料匯入成功！");
          }
          setImportError('');
      } catch (e: any) {
          setImportError(`匯入失敗：${e.message}`);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">設定與資料管理</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
            <button 
                className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'GENERAL' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-700/30' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveTab('GENERAL')}
            >
                一般設定
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'DATA' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-700/30' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveTab('DATA')}
            >
                資料備份 / 轉移
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {activeTab === 'GENERAL' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            美元匯率 (USD to TWD)
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="number"
                                step="0.01"
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                            />
                            <button 
                                onClick={onRefreshRate}
                                disabled={isRateLoading}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <RefreshCcw size={18} className={isRateLoading ? 'animate-spin' : ''} />
                                即時更新
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            匯率將影響美股與美金資產的台幣估值。
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'DATA' && (
                <div className="space-y-8">
                     {/* Explanation */}
                     <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg">
                        <div className="flex gap-3">
                            <AlertTriangle className="text-indigo-400 shrink-0" size={20} />
                            <div className="text-sm text-indigo-200">
                                <p className="font-bold mb-1">為什麼資料沒有同步？</p>
                                <p className="opacity-80">因為沒有架設伺服器，您的資料目前儲存在這台裝置的瀏覽器中。若要在手機與電腦間轉移資料，請使用下方的匯出/匯入功能。</p>
                            </div>
                        </div>
                    </div>

                    {/* Export */}
                    <div>
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Download size={18} className="text-emerald-400"/>
                            匯出資料 (備份)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleExport}
                                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                                <Download size={16} /> 下載檔案
                            </button>
                             <button 
                                onClick={handleCopyToClipboard}
                                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                                {copySuccess ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                {copySuccess ? '已複製' : '複製代碼'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            將產生的 `.json` 檔案傳送到另一台裝置，或複製代碼貼上。
                        </p>
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>

                    {/* Import */}
                    <div>
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Upload size={18} className="text-blue-400"/>
                            匯入資料 (還原)
                        </h3>
                        
                        <input 
                            type="file" 
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleFileImport}
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-slate-900 border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 py-6 rounded-lg flex flex-col items-center justify-center gap-2 transition mb-3"
                        >
                            <Upload size={24} />
                            <span>點擊選擇備份檔案 (.json)</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-800 px-2 text-slate-500">或是貼上代碼</span>
                            </div>
                        </div>

                        <textarea
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-white font-mono h-24 mt-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder='在此貼上 {"version": "1.0", ...}JSON 代碼'
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                        />
                        
                        {importError && (
                            <p className="text-rose-400 text-xs mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> {importError}
                            </p>
                        )}

                        <button 
                            onClick={handleTextImport}
                            disabled={!importJson}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white mt-3 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            確認匯入
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
