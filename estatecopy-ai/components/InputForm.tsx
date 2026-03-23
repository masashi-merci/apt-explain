
import React, { useEffect, useState } from 'react';
import { FormData, Agent, User } from '../types';

interface InputFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  isLoading: boolean;
  agents: Agent[];
  currentUser: User;
  useSearch: boolean;
  setUseSearch: (val: boolean) => void;
}

const InputForm: React.FC<InputFormProps> = ({ 
  formData, setFormData, onSubmit, isLoading, agents, currentUser, useSearch, setUseSearch 
}) => {
  const [showTextPaste, setShowTextPaste] = useState(false);
  
  useEffect(() => {
    if (currentUser.role === 'AGENT') {
      setFormData(prev => ({ ...prev, selectedAgentId: currentUser.id }));
    }
  }, [currentUser, setFormData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, pdfFile: e.target.files![0] }));
    }
  };

  const isFormValid = formData.propertyName && formData.address && formData.selectedAgentId;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="bg-orange-500 w-1.5 h-6 rounded-full mr-3"></span>
        物件情報入力
      </h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">担当者 <span className="text-red-500">*</span></label>
          <select
            value={formData.selectedAgentId}
            onChange={(e) => setFormData(prev => ({ ...prev, selectedAgentId: e.target.value }))}
            disabled={isLoading || currentUser.role === 'AGENT'}
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="">選択してください</option>
            {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={formData.propertyType}
            onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value as any }))}
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="mansion">マンション</option>
            <option value="house">戸建て</option>
            <option value="other">その他</option>
          </select>
          <input
            type="text"
            placeholder="物件名 *"
            className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.propertyName}
            onChange={e => setFormData(prev => ({ ...prev, propertyName: e.target.value }))}
          />
        </div>
        <input
          type="text"
          placeholder="住所 *"
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 ml-1">築年 (西暦または築年数) <span className="font-normal opacity-70">(任意)</span></label>
            <input
              type="text"
              placeholder="例: 2015 または 築10年"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.buildingAge}
              onChange={e => setFormData(prev => ({ ...prev, buildingAge: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 ml-1">総戸数 <span className="font-normal opacity-70">(任意)</span></label>
            <input
              type="text"
              placeholder="例: 50"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.totalUnits}
              onChange={e => setFormData(prev => ({ ...prev, totalUnits: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-800">最新情報を検索する</label>
            <p className="text-[10px] text-gray-500">※周辺施設やネット上の情報を自動調査します。</p>
          </div>
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${useSearch ? 'bg-orange-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${useSearch ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="url"
            placeholder="参考URL (https://...)"
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.referenceUrl}
            onChange={e => setFormData(prev => ({ ...prev, referenceUrl: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setShowTextPaste(!showTextPaste)}
            className="text-xs text-orange-600 font-bold hover:underline"
          >
            {showTextPaste ? '▼ 非表示' : '▶ サイト情報をコピペ入力'}
          </button>
          {showTextPaste && (
            <textarea
              className="w-full p-3 border rounded-lg h-32 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ポータルサイト等の物件概要を貼り付けてください"
              value={formData.referenceText}
              onChange={e => setFormData(prev => ({ ...prev, referenceText: e.target.value }))}
            />
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors relative">
          <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
          <p className="text-gray-500 text-sm">{formData.pdfFile ? formData.pdfFile.name : '物件概要(PDF)をアップロード'}</p>
        </div>

        <button
          onClick={onSubmit}
          disabled={!isFormValid || isLoading}
          className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all ${!isFormValid || isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
        >
          {isLoading ? 'AIが生成中...' : '紹介文を作成する'}
        </button>
      </div>
    </div>
  );
};

export default InputForm;
