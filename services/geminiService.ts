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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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

export const fetchStockPrice = async (ticker: string, type: AssetType): Promise<number | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let searchQuery = '';
    
    // Optimize query for Google Search to trigger Finance widget
    if (type === AssetType.TW_STOCK) {
        const cleanTicker = ticker.replace(/[^0-9a-zA-Z]/g, '');
        if (/^\d{4}$/.test(cleanTicker)) {
            searchQuery = `Current stock price of ${cleanTicker}.TW on Google Finance`;
        } else {
            searchQuery = `Current stock price of ${ticker} in Taiwan stock market`;
        }
    } else {
        // US Stocks
        searchQuery = `Current stock price of ${ticker} on Google Finance`;
    }

    // Using gemini-3-flash-preview as recommended for search grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchQuery,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are a financial data assistant.
          Task: Find the LATEST market price for the stock provided.
          
          INSTRUCTIONS:
          1. Use Google Search to find the price.
          2. Return ONLY the numeric value (e.g., 1450.5).
          3. No currency symbols, no commas, no extra text.
          4. If not found, return "0".
        `,
      }
    });

    const text = response.text?.trim();
    console.log(`[Stock Fetch] ${ticker} response:`, text);
    
    if (text) {
      // Remove commas from thousands separators (e.g., 1,450.00 -> 1450.00)
      const normalizedText = text.replace(/,/g, '');
      // Extract the first number found in the text
      const match = normalizedText.match(/\d+(\.\d+)?/);
      if (match) {
        const price = parseFloat(match[0]);
        if (price > 0) {
          console.log(`[Stock Fetch] ${ticker} successfully parsed: ${price}`);
          return price;
        }
      }
    }
    
    console.warn(`[Stock Fetch] ${ticker} failed to parse price from: "${text}"`);
    return null;
  } catch (error) {
    console.error(`[Stock Fetch] ${ticker} error:`, error);
    return null;
  }
};
