import React, { useState } from 'react';
import { MealRecord } from '../types';
import { Trash2, Download, Search, CheckSquare, Square } from 'lucide-react';

interface HistoryProps {
  history: MealRecord[];
  onDelete: (ids: string[]) => void;
}

const HistoryTab: React.FC<HistoryProps> = ({ history, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((record) =>
    record.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalories = filteredHistory.reduce((sum, record) => sum + record.calories, 0);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie_history_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">饮食记录</h1>
          <div className="flex gap-2">
            {!isSelectionMode ? (
              <>
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  title="导出"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="text-emerald-600 font-medium text-sm px-2"
                >
                  管理
                </button>
              </>
            ) : (
              <>
                 <button
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  className={`text-red-500 font-medium text-sm px-2 ${selectedIds.size === 0 ? 'opacity-50' : ''}`}
                >
                  删除 ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="text-gray-500 font-medium text-sm px-2"
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Search & Stats */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索记录..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 text-sm py-2 pl-9 pr-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </div>
            <div className="text-right">
                <span className="block text-xs text-gray-500">总热量</span>
                <span className="font-bold text-emerald-600">{totalCalories} kcal</span>
            </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p>暂无记录</p>
          </div>
        ) : (
          filteredHistory.slice().reverse().map((item) => (
            <div
              key={item.id}
              onClick={() => isSelectionMode && toggleSelection(item.id)}
              className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all ${
                isSelectionMode ? 'cursor-pointer active:scale-[0.98]' : ''
              }`}
            >
              {isSelectionMode && (
                <div className={selectedIds.has(item.id) ? 'text-emerald-500' : 'text-gray-300'}>
                  {selectedIds.has(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-400 font-medium mb-1 block">
                    {formatDate(item.timestamp)}
                  </span>
                  <span className="font-bold text-gray-800 text-lg">
                    {item.calories} <span className="text-xs font-normal text-gray-500">kcal</span>
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                  {item.summary}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryTab;