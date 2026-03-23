
import { GoogleGenAI, Part, ThinkingLevel } from "@google/genai";
import { FLATTENED_FORBIDDEN_WORDS } from "../constants";
import { getNearbyFacilities } from "./mapsService";

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// APIキー取得ロジックの強化（Vite/Vercel両対応）
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // @ts-ignore - Vite environment variables
  const viteApiKey = import.meta.env?.VITE_API_KEY || import.meta.env?.API_KEY;
  if (viteApiKey) return viteApiKey;
  
  // Fallback to window global if injected
  return (window as any).__ENV_API_KEY__;
};

const simulateStream = async (onChunk: (text: string) => void) => {
  const demoText = `【キャッチコピー案】
1. 横浜・関内エリアの利便性を享受する、都市型レジデンスの真価。
2. 2路線利用可能。歴史と先進が交差する「石川町」で描く、上質な日常。
3. 公園と利便施設が寄り添う住環境。ブリシア横濱石川町、誕生。

【物件紹介文】
神奈川県横浜市中区長者町に位置する「ブリシア横濱石川町」は、利便性と居住性を兼ね備えた、鉄筋コンクリート造のマンションです。
交通アクセスは、JR京浜東北・根岸線「石川町」駅まで徒歩8分、横浜市営地下鉄ブルーライン「伊勢佐木長者町」駅まで徒歩7分と、2路線が利用可能。横浜エリアはもちろん、都心方面へのアクセスもスムーズです。

周辺環境の充実も本物件の大きな魅力です。徒歩圏内には「まいばすけっと」や「ローソン」などの買い物施設が点在し、日々の生活をサポートします。また、横浜スタジアムを擁する「横浜公園」や、遊具のある「扇町公園」も近く、都市機能の中にありながら緑を感じられる環境が整っています。
教育機関や医療施設も充実しており、単身者からファミリーまで、幅広い層にとって暮らしやすい住環境が提供されています。歴史ある横浜の街並みと調和する、洗練された外観デザインも特徴の一つです。`;
  
  const chunks = demoText.split("");
  let current = "";
  for (const char of chunks) {
    current += char;
    onChunk(current);
    await new Promise(r => setTimeout(r, 5));
  }
  return demoText;
};

export const generatePropertyDescriptionStream = async (
  propertyName: string,
  address: string,
  pdfFile: File | null,
  referenceUrl: string,
  referenceText: string | undefined,
  useSearch: boolean,
  onChunk: (text: string) => void,
  buildingAge?: string,
  totalUnits?: string,
  floorPlanText?: string,
  floorPlanImage?: File | null,
  propertyType?: 'mansion' | 'house' | 'other'
): Promise<{ fullText: string; groundingUrls: string[]; facilities: any[] }> => {
  
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("APIキー未設定のためデモモードで動作します。Vercel等の管理画面で API_KEY を設定してください。");
    const fullText = await simulateStream(onChunk);
    return { fullText, groundingUrls: [], facilities: [] };
  }

  // 1. Google Maps APIを使用して正確な周辺情報を取得
  let nearbyFacilities: any[] = [];
  try {
    nearbyFacilities = await getNearbyFacilities(address);
  } catch (error) {
    console.error("Failed to fetch nearby facilities from Maps API:", error);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const parts: Part[] = [];

  if (pdfFile) {
    parts.push({ inlineData: { mimeType: 'application/pdf', data: await convertFileToBase64(pdfFile) } });
  }
  if (floorPlanImage) {
    parts.push({ inlineData: { mimeType: floorPlanImage.type, data: await convertFileToBase64(floorPlanImage) } });
  }

  const forbiddenListString = FLATTENED_FORBIDDEN_WORDS.join(', ');

  const systemInstruction = `
あなたは先進的な不動産会社「ミルズ（MILLS）」の専属AIコピーライターです。
不動産公正競争規約を遵守し、正確かつ魅力的な文章を生成します。

【最重要：周辺施設の特定とリスト化の鉄則】
1. **提供されたデータの優先使用**: ユーザープロンプトで提供される「周辺施設データ」を最優先で使用してください。
2. **カテゴリー別・複数検索の徹底**: 提供データが不足している場合のみ、Google検索を使用し、以下のカテゴリーごとに「${address}」から近い順に施設を特定してください。
   - **駅**: 距離順に上位3駅
   - **学校**: 小学校、中学校、高校、大学（それぞれ最寄りを調査）
   - **コンビニ**: 距離順に上位3店舗
   - **スーパー**: 距離順に上位3店舗
   - **郵便局**: 距離順に上位3局
   - **病院**: 距離順に上位3院
3. **道のり距離の厳守**: 直線距離ではなく、必ず「徒歩ルートの道のり距離（m）」を採用してください。
3. **リストと本文の完全一致**: 本文中で紹介した施設は、必ず最後に [FACILITIES_JSON] ブロック内にも含めてください。
4. **街の魅力を語る**: エリアの雰囲気、緑の豊かさ、住みやすさを魅力的に説明してください。

【出力形式（厳守）】
必ず以下の見出しを付けてください。
---
【キャッチコピー案】
1. [案1]
2. [案2]
3. [案3]

【物件紹介文】
[物件名]は、[所在地]に位置するマンションです。
(続けて、街の特徴、アクセス、周辺環境、建物の特徴などを450文字〜550文字程度で記述。紹介した施設は距離も明記)
※物件種別が「戸建て（house）」以外の場合は、必ず「築年数」と「総戸数」を文中に含めてください。戸建ての場合は含めないでください。

[FACILITIES_JSON]
[
  {"name": "施設名", "distance": "〇〇m", "category": "駅"},
  {"name": "施設名", "distance": "〇〇m", "category": "学校"},
  {"name": "施設名", "distance": "〇〇m", "category": "コンビニ"},
  {"name": "施設名", "distance": "〇〇m", "category": "スーパー"},
  {"name": "施設名", "distance": "〇〇m", "category": "郵便局"},
  {"name": "施設名", "distance": "〇〇m", "category": "病院"}
]
[/FACILITIES_JSON]
---
`;

  const userPrompt = `
物件名: ${propertyName}
所在地: ${address}
物件種別: ${propertyType === 'house' ? '戸建て' : propertyType === 'mansion' ? 'マンション' : 'その他'}
入力スペック: 築${buildingAge || '未入力'}年 / ${totalUnits || '未入力'}戸
間取り情報（参考）: ${floorPlanText || '画像参照'}
${referenceText ? `サイト情報: ${referenceText}\n` : ''}

${nearbyFacilities.length > 0 
  ? `【周辺施設データ（Google Maps API取得）】\n${nearbyFacilities.map(f => `- ${f.category}: ${f.name} (徒歩${f.distanceText || '不明'})`).join('\n')}`
  : '周辺施設データが取得できませんでした。Google検索を使用して正確な情報を特定してください。'}

指示:
1. 上記の「周辺施設データ」を基に、正確な紹介文を作成してください。
2. 物件種別が「戸建て」以外（マンション等）の場合は、必ず「築年数」と「総戸数」を文中に含めてください。
   - **重要**: 入力スペックが「未入力」となっている場合は、Google検索を駆使して「${propertyName}」の正確な築年（または築年数）と総戸数を調査し、その結果を記載してください。
   - 調査してもどうしても判明しない場合のみ「不明」としてくださいが、可能な限り数値を特定してください。
3. 物件種別が「戸建て」の場合は、築年数と総戸数は記載しないでください。
4. データが不足している項目（駅、学校、コンビニ、スーパー、郵便局、病院の各上位3件など）がある場合は、Google検索を使い、「${address}」から「徒歩ルート」で近い順に補完してください。
5. 特に「駅」については、最も近い駅を見落とさないよう、住所周辺の路線図を精密に確認してください。
6. 街の魅力を盛り込んだ魅力的な紹介文を作成してください。
7. 特定した施設は、名称と道のり距離（m）を本文に記載し、かつ必ず [FACILITIES_JSON] 内にすべてリストアップしてください。
`;

  try {
    parts.push({ text: userPrompt });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: parts }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [
          { googleSearch: {} }
        ]
      }
    });

    let fullText = "";
    let groundingUrls: string[] = [];

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        fullText += textChunk;
        // JSONタグが含まれている場合は、表示用のテキストから除外してストリームに流す
        const displayPath = fullText.split('[FACILITIES_JSON]')[0];
        onChunk(displayPath);
      }
      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach(c => { if (c.web?.uri) groundingUrls.push(c.web.uri); });
      }
    }

    // 施設リストの抽出
    let facilities: any[] = [];
    const jsonMatch = fullText.match(/\[FACILITIES_JSON\]([\s\S]*?)\[\/FACILITIES_JSON\]/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        facilities = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse facilities JSON:", e);
      }
    }

    // 表示用テキストからJSONタグを削除
    const finalDisplayText = fullText.replace(/\[FACILITIES_JSON\][\s\S]*?\[\/FACILITIES_JSON\]/, '').trim();

    return { 
      fullText: finalDisplayText, 
      groundingUrls: [...new Set(groundingUrls)],
      facilities
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { fullText: await simulateStream(onChunk), groundingUrls: [], facilities: [] };
  }
};
