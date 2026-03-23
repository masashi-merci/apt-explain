
import React from 'react';
import { Facility } from '../types';

interface FacilityListProps {
  facilities: Facility[] | undefined;
  isLoading: boolean;
}

const FacilityList: React.FC<FacilityListProps> = ({ facilities, isLoading }) => {
  if (isLoading) return null;
  if (!facilities || facilities.length === 0) return null;

  const categories = ['アクセス', '駅', 'コンビニ', '飲食', '学校', '郵便局', 'その他'] as const;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center mb-6">
        <div className="bg-orange-100 p-2 rounded-lg mr-3">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">周辺施設・アクセス</h2>
        <span className="ml-3 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Search Results</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => {
          const categoryFacilities = facilities.filter(f => f.category === category);
          if (categoryFacilities.length === 0) return null;
          
          const isAccess = category === 'アクセス';

          return (
            <div key={category} className={`group rounded-xl p-4 border transition-all duration-300 ${
              isAccess 
                ? 'bg-gray-900 border-gray-800 shadow-lg md:col-span-2' 
                : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className={`w-1.5 h-4 rounded-full mr-2 ${
                    category === 'アクセス' ? 'bg-orange-500' :
                    category === '駅' ? 'bg-blue-500' :
                    category === 'コンビニ' ? 'bg-green-500' :
                    category === '飲食' ? 'bg-orange-500' :
                    category === '学校' ? 'bg-purple-500' :
                    category === '郵便局' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></span>
                  <span className={`text-xs font-black uppercase tracking-tighter ${isAccess ? 'text-white' : 'text-gray-900'}`}>
                    {category === 'アクセス' ? '主要駅へのアクセス（乗車時間）' : category}
                  </span>
                </div>
                {!isAccess && <span className="text-[10px] text-gray-300 font-bold">{categoryFacilities.length} items</span>}
              </div>
              <ul className={`space-y-2 ${isAccess ? 'grid grid-cols-2 sm:grid-cols-4 gap-4 space-y-0' : ''}`}>
                {categoryFacilities.map((f, i) => (
                  <li key={i} className={`flex justify-between items-start group/item ${isAccess ? 'flex-col sm:items-center text-center' : ''}`}>
                    <div className="flex items-center overflow-hidden">
                      <span className={`text-sm font-medium leading-tight transition-colors truncate ${
                        isAccess ? 'text-gray-400 mb-1' : 'text-gray-700 group-hover/item:text-black'
                      }`}>
                        {f.name}
                      </span>
                      {f.url && (
                        <a 
                          href={f.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                          title="Googleマップで見る"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {f.distance && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap font-mono ${
                        isAccess ? 'text-orange-400 bg-orange-400/10 text-xs font-bold' : 'text-gray-400 bg-gray-50'
                      }`}>
                        {f.distance}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => {
            const text = facilities.map(f => `[${f.category}] ${f.name} ${f.distance || ''}`).join('\n');
            navigator.clipboard.writeText(text);
            alert('リストをコピーしました');
          }}
          className="text-[10px] font-bold text-gray-400 hover:text-orange-600 flex items-center transition-colors"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          リスト形式でコピー
        </button>
      </div>
    </div>
  );
};

export default FacilityList;
