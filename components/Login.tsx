
import React, { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { Wallet, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (method: 'popup' | 'redirect') => {
    setLoading(true);
    setError(null);
    try {
      if (method === 'popup') {
        await signInWithPopup(auth, googleProvider);
      } else {
        await signInWithRedirect(auth, googleProvider);
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      
      let errorMsg = "登入失敗，請稍後再試。";
      
      if (err.code === 'auth/popup-blocked') {
        errorMsg = "彈出視窗被瀏覽器阻擋了，請改用「重新導向登入」。";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = "Firebase 尚未啟用 Google 登入功能。請前往 Firebase Console -> Authentication -> Sign-in method 啟用。";
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = "此網域尚未被 Firebase 列入授權清單。請至 Firebase Console -> Authentication -> Settings -> Authorized Domains 新增此網址。";
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMsg = "登入視窗已關閉。";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
          <Wallet size={32} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">WealthFolio</h1>
        <p className="text-slate-400 mb-8">您的智慧資產管家，支援雲端同步。</p>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-left flex gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500 shrink-0" size={20} />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8 text-left bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">資料安全加密儲存，只有您可以存取。</p>
            </div>
            <div className="flex items-start gap-3">
                <ShieldCheck className="text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">支援手機、電腦、平板多裝置即時同步。</p>
            </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => handleLogin('popup')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />}
              使用 Google 帳號登入
          </button>
          
          <button 
            onClick={() => handleLogin('redirect')}
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            彈出視窗沒反應？試試重新導向登入
          </button>
        </div>
        
        <p className="text-xs text-slate-600 mt-6">
            繼續即代表您同意使用 Firebase 進行身分驗證與資料儲存。
        </p>
      </div>
    </div>
  );
};

export default Login;
