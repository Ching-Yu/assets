
import { GoogleGenAI } from "@google/genai";
import { Asset, AssetType } from "../types";

const SYSTEM_INSTRUCTION = `
你是專業的財務投資顧問。
你的目標是分析用戶的股票和現金投資組合。
用戶持有台股 (TW_STOCK)、美股 (US_STOCK) 和現金。
請使用「繁體中文」回答。
輸出格式請使用簡潔的 Markdown。
重點分析：
1. 資產配置平衡 (股票 vs 現金)。
2. 產業集中度 (根據代碼如 2330, AAPL, NVDA 猜測產業)。
3. 潛在風險 (例如：過度集中在科技股)。
4. 針對目前的市場趨勢提供一段簡短的建議。
5. 簡短的鼓勵性總結。
請保持在 400 字以內。適當使用表情符號。
`;

export const analyzePortfolioWithGemini = async (assets: Asset[], exchangeRate: number): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "⚠️ 尚未設定 API Key。\n\n如需使用 AI 分析功能，請確認環境變數中已包含 `API_KEY`。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Prepare data for the model
    const portfolioDesc = assets.map(a => {
      let value = 0;
      let currency = 'TWD';
      
      if (a.type === AssetType.TW_STOCK) {
        value = a.shares * a.currentPrice;
      } else if (a.type === AssetType.US_STOCK) {
        value = a.shares * a.currentPrice;
        currency = 'USD';
      } else if (a.type === AssetType.CASH_TWD) {
        value = a.currentPrice;
      } else if (a.type === AssetType.CASH_USD) {
        value = a.currentPrice;
        currency = 'USD';
      }

      return `- [${a.type}] ${a.name}: ${value.toFixed(2)} ${currency}`;
    }).join('\n');

    const prompt = `
    這是我的目前投資組合配置。匯率為 1 美元 = ${exchangeRate} 台幣。
    
    ${portfolioDesc}
    
    請分析我的投資組合結構並提供專業建議。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "目前無法產生分析報告。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "連線 AI 服務發生錯誤，請檢查您的 API Key 或稍後再試。";
  }
};

/**
 * Fetch Stock Price using Yahoo Finance (via corsproxy.io)
 */
export const fetchStockPrice = async (ticker: string, type: AssetType): Promise<number | null> => {
  try {
    let symbol = ticker.trim();

    // Intelligent Symbol Parsing
    if (type === AssetType.TW_STOCK) {
        // 1. Try to extract 4 or more digits (e.g., "2330 台積電" -> "2330")
        const match = symbol.match(/(\d{4,})/);
        if (match) {
            symbol = `${match[1]}.TW`;
        } else {
             // 2. If no digits found, keep as is. If only digits provided, append .TW
             if (/^\d+$/.test(symbol)) {
                 symbol = `${symbol}.TW`;
             }
        }
    } else {
        // For US stocks, assume the first word is the ticker (e.g., "NVDA Corp" -> "NVDA")
        symbol = symbol.split(' ')[0].toUpperCase();
    }

    // Add cache buster timestamp
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&nocache=${Date.now()}`;
    
    // Use corsproxy.io for better stability
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result || !result.meta) {
        // Fallback for some cases or just log warning
        console.warn(`No price data found for ${symbol}`);
        return null;
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose;

    return typeof price === 'number' ? price : null;
  } catch (error) {
    console.error(`Stock Price Fetch Error (${ticker}):`, error);
    return null;
  }
};
