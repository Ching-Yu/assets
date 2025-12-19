
import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { Wallet, ShieldCheck, AlertCircle, Loader2, Copy, Check, Globe, ExternalLink, ArrowUpRight, User } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; domain?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    const inIframe = window.self !== window.top;
    setIsIframe(inIframe);
    
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    setCurrentOrigin(hostname || origin);
  }, []);

  const handleLogin = async (method: 'popup' | 'redirect' | 'anonymous') => {
    setLoading(true);
    setError(null);
    try {
      if (method === 'popup') {
        await signInWithPopup(auth, googleProvider);
      } else if (method === 'redirect') {
        await signInWithRedirect(auth, googleProvider);
      } else if (method === 'anonymous') {
        // 匿名登入：不需要網域驗證
        await signInAnonymously(auth);
      }
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      
      let errorMsg = "登入失敗，請稍後再試。";
      let domain = window.location.hostname;

      if (err.code === 'auth/popup-blocked') {
        errorMsg = "彈出視窗被阻擋。請嘗試「在新分頁開啟」此網頁，或使用訪客登入。";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = "登入方式尚未啟用。若使用訪客登入，請至 Firebase Console > Authentication > Sign-in method 開啟「匿名 (Anonymous)」。";
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = `網域尚未授權。Google 登入需要驗證網域，建議您先使用「訪客試用」模式。`;
      } else {
        errorMsg = `錯誤 (${err.code}): ${err.message}`;
      }
      
      setError({ message: errorMsg, domain });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center relative overflow-hidden">
        
        {/* Iframe Warning Banner */}
        {isIframe && (
            <div className="absolute top-0 left-0 right-0 bg-indigo-900/90 text-indigo-100 text-xs font-bold py-2 px-4 flex items-center justify-center gap-2">
                <ExternalLink size={14} />
                <span>建議使用「訪客試用」以避開網域限制</span>
            </div>
        )}

        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 mt-6">
          <Wallet size={32} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">WealthFolio</h1>
        <p className="text-slate-400 mb-8">您的智慧資產管家</p>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-left animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-3">
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                <div className="text-sm text-rose-200 whitespace-pre-wrap">{error.message}</div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {/* 匿名登入按鈕 - 最推薦的方式 */}
          <button 
            onClick={() => handleLogin('anonymous')}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
          >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <User size={20} />}
              訪客試用 (無需驗證網域)
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500">或連結 Google 帳號</span>
            </div>
          </div>

          <button 
            onClick={() => handleLogin('popup')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 border border-slate-200"
          >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google 登入 (需設定網域)
          </button>
        </div>
        
        {/* Domain Helper (Collapsed/Secondary info now) */}
        <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
             <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Globe size={10} /> 偵測到的網域 (Google 登入用)
                </span>
                <button 
                    onClick={() => copyToClipboard(currentOrigin)}
                    className="text-slate-500 hover:text-white transition"
                    title="複製"
                >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
            </div>
             <code className="text-xs text-indigo-300 font-mono break-all block">
                {currentOrigin}
            </code>
        </div>
        
        <div className="text-center">
             <p className="text-[10px] text-slate-500">
                訪客模式同樣支援雲端資料儲存，但若清除瀏覽器快取可能會遺失資料。<br/>
                建議稍後於設定中匯出備份檔案。
             </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
