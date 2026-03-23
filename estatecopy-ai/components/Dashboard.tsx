import React, { useState, useEffect } from 'react';
import { LogEntry, Agent, User } from '../types';
import { getLogsByClient, getClientAgents, addAgent, deleteAgent } from '../services/storageService';

interface DashboardProps {
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Agent Form
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentUser, setNewAgentUser] = useState('');
  const [newAgentPass, setNewAgentPass] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser.clientId) {
      refreshData();
    }
  }, [currentUser]);

  const refreshData = async () => {
    if (!currentUser.clientId) return;
    setIsLoading(true);
    try {
      const [fetchedLogs, fetchedAgents] = await Promise.all([
        getLogsByClient(currentUser.clientId),
        getClientAgents(currentUser.clientId)
      ]);
      setLogs(fetchedLogs);
      setAgents(fetchedAgents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgent = async () => {
    if (!currentUser.clientId) return;
    if (!newAgentName || !newAgentUser || !newAgentPass) {
      setError('全ての項目を入力してください');
      return;
    }

    try {
      await addAgent(currentUser.clientId, newAgentName, newAgentUser, newAgentPass);
      setNewAgentName('');
      setNewAgentUser('');
      setNewAgentPass('');
      setError('');
      refreshData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!currentUser.clientId) return;
    if (window.confirm('このエージェントを削除しますか？')) {
      await deleteAgent(agentId);
      refreshData();
    }
  };

  const totalGenerations = logs.length;
  // Stats for Search Usage
  const searchOnCount = logs.filter(l => l.search_used).length;
  const searchOffCount = logs.filter(l => !l.search_used).length;
  
  const today = new Date().toISOString().slice(0, 10);
  const todaysCount = logs.filter(log => log.timestamp.slice(0, 10) === today).length;

  return (
    <div className="space-y-8">
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 z-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">本日の作成数</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{todaysCount} <span className="text-sm font-normal text-gray-400">件</span></p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">検索機能 利用回数</h3>
          <div className="flex items-end mt-2">
            <p className="text-3xl font-bold text-orange-600">{searchOnCount}</p>
            <p className="text-gray-400 text-sm ml-2 mb-1">/ OFF: {searchOffCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">累計作成数</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalGenerations} <span className="text-sm font-normal text-gray-400">件</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            エージェント管理
          </h2>
          
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

          <div className="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-xs font-bold text-gray-500">新規エージェント登録</h4>
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="氏名 (表示名)"
              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-orange-500 outline-none bg-white text-gray-900"
            />
            <input
              type="text"
              value={newAgentUser}
              onChange={(e) => setNewAgentUser(e.target.value)}
              placeholder="ログインID"
              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-orange-500 outline-none bg-white text-gray-900"
            />
            <input
              type="password"
              value={newAgentPass}
              onChange={(e) => setNewAgentPass(e.target.value)}
              placeholder="パスワード"
              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-orange-500 outline-none bg-white text-gray-900"
            />
            <button
              onClick={handleAddAgent}
              disabled={isLoading}
              className="w-full bg-black text-white px-3 py-2 rounded text-sm font-bold hover:bg-gray-800 disabled:bg-gray-400"
            >
              登録する
            </button>
          </div>

          <h4 className="text-xs font-bold text-gray-500 mb-2">登録済みリスト</h4>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {agents.map(agent => (
              <li key={agent.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 border border-gray-100">
                <div>
                  <div className="text-sm font-bold">{agent.name}</div>
                  <div className="text-xs text-gray-400">ID: {agent.username}</div>
                </div>
                <button
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
            {agents.length === 0 && (
              <li className="text-sm text-gray-400 text-center py-2">エージェントがいません</li>
            )}
          </ul>
        </div>

        {/* Generation History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            自社の作成履歴
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">日時</th>
                  <th className="px-4 py-3">物件名</th>
                  <th className="px-4 py-3">担当者</th>
                  <th className="px-4 py-3">検索</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(log.timestamp).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{log.property_name}</td>
                    <td className="px-4 py-3 text-gray-600">{log.agent_name}</td>
                    <td className="px-4 py-3">
                      {log.search_used ? (
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">ON</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">OFF</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-orange-600 hover:text-orange-800 font-bold text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">履歴がありません</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedLog.property_name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <span>{selectedLog.address}</span>
                  <span>|</span>
                  <span>{selectedLog.agent_name}</span>
                  <span>|</span>
                  {selectedLog.search_used ? <span className="text-orange-600 font-bold">検索ON</span> : <span>検索OFF</span>}
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                  {selectedLog.result_text}
                </p>
              </div>
              {selectedLog.grounding_urls && selectedLog.grounding_urls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2">参照元URL:</p>
                  <ul className="text-xs text-blue-500 space-y-1">
                    {selectedLog.grounding_urls.map((url, i) => (
                      <li key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{url}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;