import React, { useState, useEffect } from 'react';
import { Client, LogEntry, Agent } from '../types';
import { getAllClients, getAllLogs, addClient, deleteClient } from '../services/storageService';

const SuperAdminDashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewingClientAgents, setViewingClientAgents] = useState<{clientName: string, agents: Agent[]} | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Client Form
  const [newClientName, setNewClientName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedClients, fetchedLogs] = await Promise.all([
        getAllClients(),
        getAllLogs()
      ]);
      setClients(fetchedClients);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      if (!newClientName || !newUsername || !newPassword) {
        setError('全ての項目を入力してください');
        return;
      }
      await addClient(newClientName, newUsername, newPassword);
      setNewClientName('');
      setNewUsername('');
      setNewPassword('');
      setError('');
      refreshData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('このクライアントと関連データを完全に削除しますか？')) {
      await deleteClient(id);
      refreshData();
    }
  };

  // Stats
  const totalGenerations = logs.length;
  const searchOnCount = logs.filter(l => l.search_used).length;
  const searchOffCount = logs.filter(l => !l.search_used).length;

  return (
    <div className="space-y-8">
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 z-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Global Stats */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-bold">Milztech Global Admin</h2>
          <button 
            onClick={refreshData}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            更新
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
             <p className="text-gray-400 text-xs uppercase tracking-wider">総クライアント数</p>
             <p className="text-3xl font-bold mt-1">{clients.length} <span className="text-sm font-normal text-gray-400">社</span></p>
           </div>
           <div>
             <p className="text-gray-400 text-xs uppercase tracking-wider">総生成回数</p>
             <p className="text-3xl font-bold mt-1">{totalGenerations} <span className="text-sm font-normal text-gray-400">回</span></p>
           </div>
           <div>
             <p className="text-gray-400 text-xs uppercase tracking-wider">検索利用回数 (ON/OFF)</p>
             <div className="flex items-baseline mt-1">
               <span className="text-3xl font-bold text-orange-400">{searchOnCount}</span>
               <span className="text-gray-500 mx-2">/</span>
               <span className="text-xl text-gray-400">{searchOffCount}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Client Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4">新規クライアント発行</h3>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">企業名</label>
              <input 
                type="text" 
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                className="w-full p-2 border rounded focus:border-orange-500 outline-none bg-white text-gray-900"
                placeholder="株式会社〇〇不動産"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">管理者ID</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full p-2 border rounded focus:border-orange-500 outline-none bg-white text-gray-900"
                placeholder="client_admin_id"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">管理者パスワード</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded focus:border-orange-500 outline-none bg-white text-gray-900"
                placeholder="********"
              />
            </div>
            <button 
              onClick={handleAddClient}
              className="w-full bg-orange-600 text-white py-2 rounded font-bold hover:bg-orange-700"
            >
              アカウント発行
            </button>
          </div>
        </div>

        {/* Client List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">クライアント一覧</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">企業名</th>
                  <th className="px-4 py-3">管理者ID</th>
                  <th className="px-4 py-3">エージェント</th>
                  <th className="px-4 py-3">生成数</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map(client => {
                  const clientLogs = logs.filter(l => l.client_id === client.id);
                  const agentCount = client.agents ? client.agents.length : 0;
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{client.name}</td>
                      <td className="px-4 py-3 text-gray-600">{client.username}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => setViewingClientAgents({clientName: client.name, agents: client.agents || []})}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {agentCount}名 (確認)
                        </button>
                      </td>
                      <td className="px-4 py-3">{clientLogs.length}回</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-100 bg-red-50 px-2 py-1 rounded"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-400">登録クライアントがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Logs */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">全社生成ログ</h3>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full text-sm text-left relative">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">日時</th>
                <th className="px-4 py-3">企業名</th>
                <th className="px-4 py-3">物件名</th>
                <th className="px-4 py-3">担当</th>
                <th className="px-4 py-3">検索</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => {
                const client = clients.find(c => c.id === log.client_id);
                const clientName = client?.name || (log.client_id === 'super-admin' ? 'Milztech' : '削除済');
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(log.timestamp).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{clientName}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{log.property_name}</td>
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
                );
              })}
              {logs.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-4 text-gray-400">ログがありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agents Modal */}
      {viewingClientAgents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{viewingClientAgents.clientName} - エージェント一覧</h3>
              <button onClick={() => setViewingClientAgents(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {viewingClientAgents.agents.map(a => (
                  <li key={a.id} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-100">
                    <div>
                      <div className="font-bold">{a.name}</div>
                      <div className="text-xs text-gray-500">ID: {a.username}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                  {selectedLog.result_text}
                </p>
              </div>
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

export default SuperAdminDashboard;