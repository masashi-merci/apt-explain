
import React, { useMemo } from 'react';
import { GenerationResult } from '../types';
import { FLATTENED_FORBIDDEN_WORDS, REPLACEMENT_SUGGESTIONS } from '../constants';

interface ResultDisplayProps {
  result: GenerationResult | null;
  onRetry: () => void;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onRetry, isLoading }) => {
  if (!result) {
    return (
      <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 p-12 h-[600px] flex flex-col items-center justify-center text-gray-400">
        <div className="bg-white p-4 rounded-full shadow-inner mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <p className="font-medium">物件情報を入力して生成を開始してください</p>
        <p className="text-xs mt-1">AIが自動的に規約チェックと周辺調査を行います</p>
      </div>
    );
  }

  // Safety check: Scan the result text for any forbidden words
  const detectedForbiddenWords = useMemo(() => {
    // Only check if it looks like a final or substantial result (not just the start message)
    if (result.text === '生成を開始しています...') return [];
    return FLATTENED_FORBIDDEN_WORDS.filter(word => result.text.includes(word));
  }, [result.text]);

  const hasViolation = detectedForbiddenWords.length > 0;

  const getHighlightedText = () => {
    if (result.text === '生成を開始しています...') {
      return <p className="text-gray-400 italic">AIが思考を整理しています...</p>;
    }

    if (!hasViolation) {
      return <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{result.text}</p>;
    }
    
    let highlightedContent = result.text;
    
    // Sort by length (descending) to correctly handle overlapping terms
    const sortedWords = [...detectedForbiddenWords].sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
      // Escape special regex chars just in case
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      const suggestion = REPLACEMENT_SUGGESTIONS[word] || '規約違反の可能性があります';
      const shortSuggestion = suggestion.length > 15 ? suggestion.substring(0, 12) + '...' : suggestion;

      // Inline suggestion UI
      const replacementHtml = `
        <span class="group inline-flex items-baseline flex-wrap gap-x-1 relative">
          <span class="bg-red-100 text-red-700 font-bold px-1 rounded border border-red-200 underline decoration-red-300 decoration-2">${word}</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 select-none cursor-help transform translate-y-[-2px]">
            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            ${shortSuggestion}
          </span>
          <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 z-50 text-center shadow-xl">
            ${suggestion}
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
          </span>
        </span>
      `.replace(/\s+/g, ' ').trim();

      highlightedContent = highlightedContent.replace(regex, replacementHtml);
    });

    return (
      <div 
        className="whitespace-pre-wrap leading-relaxed text-gray-800"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    );
  };

  const isLengthValid = result.characterCount >= 450 && result.characterCount <= 550;
  const isGenerating = isLoading || result.text === '生成を開始しています...';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className={`w-2 h-6 bg-orange-500 rounded-full mr-3 ${isGenerating ? 'animate-pulse' : ''}`}></span>
          生成結果
        </h2>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
          isGenerating ? 'bg-gray-50 text-gray-400 border-gray-200' :
          isLengthValid ? 'bg-green-50 text-green-700 border-green-200' : 
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          {result.characterCount} 文字
        </div>
      </div>

      {hasViolation && !isGenerating && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-bold">
              規約違反の表現が検出されました。文中の指摘箇所を確認してください。
            </p>
          </div>
        </div>
      )}

      <div className={`flex-grow p-6 rounded-xl border transition-all duration-500 overflow-y-auto max-h-[600px] ${
        isGenerating ? 'bg-gray-50 border-gray-100' : 'bg-orange-50 bg-opacity-30 border-orange-100'
      }`}>
        {getHighlightedText()}
      </div>

      {result.address && !isGenerating && (
        <div className="mt-6 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            周辺マップ
          </h3>
          <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100 relative">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=${process.env.GOOGLE_MAPS_API_KEY || process.env.API_KEY}&q=${encodeURIComponent(result.address + " 周辺 施設")}&zoom=15`}
            ></iframe>
            {/* APIキーエラー時の補助メッセージ（iframeの背後に配置） */}
            <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-gray-500">
                Google Maps APIキーの設定が必要です。<br />
                「Maps Embed API」が有効になっているかご確認ください。
              </p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">※AIはGoogle Mapのデータを基に周辺1km圏内の施設を調査しています。</p>
        </div>
      )}

      {result.facilities && result.facilities.length > 0 && !isGenerating && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            周辺施設リスト（カテゴリー別）
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['駅', '学校', 'コンビニ', 'スーパー', '郵便局', '病院', 'その他'].map(category => {
              const categoryFacilities = result.facilities?.filter(f => f.category === category);
              if (!categoryFacilities || categoryFacilities.length === 0) return null;
              
              return (
                <div key={category} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 ${
                      category === '駅' ? 'bg-blue-100 text-blue-700' :
                      category === 'コンビニ' ? 'bg-green-100 text-green-700' :
                      category === 'スーパー' ? 'bg-emerald-100 text-emerald-700' :
                      category === '学校' ? 'bg-purple-100 text-purple-700' :
                      category === '郵便局' ? 'bg-red-100 text-red-700' :
                      category === '病院' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {category}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {categoryFacilities.map((f, i) => (
                      <li key={i} className="text-xs flex justify-between items-center">
                        <span className="text-gray-700 font-medium">{f.name}</span>
                        {f.distance && <span className="text-gray-400 text-[10px]">{f.distance}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isGenerating && !hasViolation && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center shadow-sm">
          <div className="bg-green-500 p-1 rounded-full mr-3">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-green-800 font-bold">公取規約チェック済み</p>
            <p className="text-[10px] text-green-600">不当表示・禁止用語（最高、格安、完売間近など）は検出されませんでした。</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs font-medium">
          {!isGenerating && !isLengthValid && (
            <span className="text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              推奨範囲(450〜550文字)から外れています
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onRetry}
            disabled={isLoading}
            className={`flex-1 sm:flex-none flex justify-center items-center font-bold px-6 py-2.5 rounded-lg border transition-all ${
              isLoading 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-sm'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            再生成
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.text);
              alert('コピーしました');
            }}
            disabled={isGenerating}
            className={`flex-1 sm:flex-none flex justify-center items-center font-bold px-6 py-2.5 rounded-lg transition-all shadow-sm ${
              isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            コピー
          </button>
        </div>
      </div>

      {result.groundingUrls.length > 0 && !isLoading && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center text-xs font-bold text-gray-500 mb-3">
            <svg className="w-3 h-3 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            参照したWebソース
          </div>
          <div className="flex flex-wrap gap-2">
            {result.groundingUrls.map((url, idx) => (
              <a 
                key={idx} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] bg-gray-50 text-orange-600 px-2 py-1 rounded border border-gray-100 hover:bg-orange-50 transition-colors truncate max-w-[200px]"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
