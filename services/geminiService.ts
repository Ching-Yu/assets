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
4. 簡短的鼓勵性總結。
請保持在 300 字以內。適當使用表情符號。
`;

export const analyzePortfolioWithGemini = async (assets: Asset[], exchangeRate: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    
    請分析我的投資組合結構。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

export const fetchStockPrice = async (ticker: string, type: AssetType): Promise<number | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let searchQuery = '';
    
    // Optimize query for Google Search to trigger Finance widget
    if (type === AssetType.TW_STOCK) {
        // If it looks like a pure number (e.g., 2330), append .TW to ensure TWSE context
        const cleanTicker = ticker.replace(/[^0-9a-zA-Z]/g, '');
        if (/^\d{4}$/.test(cleanTicker)) {
            searchQuery = `${cleanTicker}.TW stock price google finance`;
        } else {
            searchQuery = `${ticker} Taiwan stock price google finance`;
        }
    } else {
        // US Stocks
        searchQuery = `${ticker} stock price google finance`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: searchQuery,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are a financial data assistant.
          Task: Find the absolute LATEST market price for the stock ticker provided.
          
          CRITICAL INSTRUCTIONS:
          1. Use the Google Search tool. Look specifically for data from Google Finance in the search results.
          2. Return ONLY the numeric price value.
          3. Do NOT include currency symbols ($, NT, etc.).
          4. Do NOT include thousands separators (e.g., return 1450, not 1,450).
          5. If the market is closed, return the closing price.
          6. If the market is open, return the live price.
          7. If you absolutely cannot find a price, return 0.
          
          Example Correct Outputs:
          1450.00
          181.46
          
          Example Incorrect Outputs:
          1,450
          $181.46
          The price is 1450
        `,
      }
    });

    const text = response.text?.trim();
    if (text) {
      // Remove all non-numeric characters except the dot
      const cleanPrice = text.replace(/[^0-9.]/g, '');
      const price = parseFloat(cleanPrice);
      return isNaN(price) ? null : price;
    }
    
    return null;
  } catch (error) {
    console.error("Stock Price Fetch Error:", error);
    return null;
  }
};