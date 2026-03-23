
import React, { useState, useEffect } from 'react';
import { FormData, GenerationResult, ViewState, User, Agent, LogEntry } from './types';
import { generatePropertyDescriptionStream } from './services/geminiService';
import { authenticateUser, addLog, getClientAgents, getLogsByClient } from './services/storageService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { uploadFileToR2 } from './services/r2Service';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('estate_app_user_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  
  const [view, setView] = useState<ViewState>('login');
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [useSearch, setUseSearch] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    propertyName: '',
    address: '',
    propertyType: 'mansion',
    buildingAge: '',
    totalUnits: '',
    floorPlanText: '',
    floorPlanImage: null,
    pdfFile: null,
    referenceUrl: '',
    referenceText: '',
    selectedAgentId: '' 
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.clientId) {
        getLogsByClient(currentUser.clientId).then(setHistory);
        getClientAgents(currentUser.clientId).then(setAgents);
      }
      
      // 初回表示ビューの決定
      if (view === 'login') {
        if (currentUser.role === 'SUPER_ADMIN') setView('super_dashboard');
        else if (currentUser.role === 'CLIENT_ADMIN') setView('client_dashboard');
        else setView('generator');
      }
    }
  }, [currentUser]);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('estate_app_user_session', JSON.stringify(user));
      } else {
        alert('ログインIDまたはパスワードが正しくありません。');
      }
    } catch (e) {
      console.error(e);
      alert('ログイン中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('estate_app_user_session');
    setView('login');
  };

  const handleSubmit = async () => {
    if (!formData.propertyName || !formData.address) {
      alert("物件名と住所を入力してください。");
      return;
    }

    setIsLoading(true);
    setResult({ text: '生成を開始しています...', characterCount: 0, groundingUrls: [] });
    setLoadingStep('ファイルをアップロード中...');

    try {
      let pdfUrl = '';
      let floorPlanUrl = '';

      if (formData.pdfFile) {
        pdfUrl = await uploadFileToR2(formData.pdfFile);
      }
      if (formData.floorPlanImage) {
        floorPlanUrl = await uploadFileToR2(formData.floorPlanImage);
      }

      setLoadingStep('milz AI 解析中...');

      const response = await generatePropertyDescriptionStream(
        formData.propertyName,
        formData.address,
        formData.pdfFile,
        formData.referenceUrl,
        formData.referenceText,
        useSearch,
        (currentText) => {
          setLoadingStep('執筆中...');
          setResult({
            text: currentText,
            characterCount: currentText.replace(/\s/g, '').length,
            groundingUrls: []
          });
        },
        formData.buildingAge,
        formData.totalUnits,
        formData.floorPlanText,
        formData.floorPlanImage,
        formData.propertyType
      );

      setLoadingStep('公取規約チェック中...');
      await new Promise(r => setTimeout(r, 800)); // 視覚的なフィードバックのための短い待機

      setResult({
        text: response.fullText,
        characterCount: response.fullText.replace(/\s/g, '').length,
        groundingUrls: response.groundingUrls,
        facilities: response.facilities,
        address: formData.address
      });

      if (currentUser) {
        const selectedAgent = agents.find(a => a.id === formData.selectedAgentId);
        const agentName = selectedAgent ? selectedAgent.name : currentUser.name;

        await addLog({
          client_id: currentUser.clientId || currentUser.id,
          agent_id: formData.selectedAgentId || currentUser.id,
          agent_name: agentName,
          property_name: formData.propertyName,
          address: formData.address,
          result_text: response.fullText,
          grounding_urls: response.groundingUrls,
          search_used: useSearch,
          pdf_url: pdfUrl,
          floor_plan_url: floorPlanUrl
        });
        if (currentUser.clientId) {
          const updatedLogs = await getLogsByClient(currentUser.clientId);
          setHistory(updatedLogs);
        }
      }
    } catch (error) {
      console.error(error);
      alert('生成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} loginError={null} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-6">
          <div className="flex items-center cursor-pointer" onClick={() => setView('generator')}>
             <div className="bg-black text-white p-1 rounded mr-2 font-black text-xs">M</div>
             <h1 className="text-xl font-bold tracking-tight text-gray-900">EstateCopy AI</h1>
             <div className="ml-3 hidden sm:flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 text-[10px] font-bold">
               <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.567 9.29-6.433 11.719-1.028.646-2.126 1.144-3.284 1.468a11.944 11.944 0 01-3.284-1.468C5.067 16.29 2.5 11.947 2.5 7c0-.68.056-1.35.166-2.001zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
               </svg>
               Compliance Focused
             </div>
          </div>
          <nav className="hidden md:flex space-x-1">
            <button 
              onClick={() => setView('generator')} 
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${view === 'generator' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              作成
            </button>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setView('super_dashboard')} 
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${view === 'super_dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                システム管理
              </button>
            )}
            {currentUser?.role === 'CLIENT_ADMIN' && (
              <button 
                onClick={() => setView('client_dashboard')} 
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${view === 'client_dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                管理パネル
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {!isSupabaseConfigured && (
            <div className="hidden lg:flex items-center bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold border border-gray-200">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
              ローカル保存モード
            </div>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-gray-900">{currentUser?.name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{currentUser?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="ログアウト"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {view === 'generator' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <InputForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                agents={agents}
                currentUser={currentUser!}
                useSearch={useSearch}
                setUseSearch={setUseSearch}
              />
              {loadingStep && (
                <div className="bg-black text-white p-4 rounded-xl flex items-center shadow-lg animate-pulse">
                  <div className="mr-4">
                    <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-bold">{loadingStep}</span>
                </div>
              )}
            </div>
            <ResultDisplay result={result} onRetry={handleSubmit} isLoading={isLoading} />
          </div>
        ) : view === 'super_dashboard' ? (
          <div className="max-w-7xl mx-auto"><SuperAdminDashboard /></div>
        ) : (
          <div className="max-w-7xl mx-auto"><Dashboard currentUser={currentUser!} /></div>
        )}
      </main>
    </div>
  );
};

export default App;
