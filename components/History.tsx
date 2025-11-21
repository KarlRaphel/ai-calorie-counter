import React, { useState, useEffect } from 'react';
import { MealRecord } from '../types';
import { Download, Search, CheckSquare, Square } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistoryProps {
  history: MealRecord[];
  onDelete: (ids: string[]) => void;
  onImport?: (records: MealRecord[]) => void;
}

const HistoryTab: React.FC<HistoryProps> = ({ history, onDelete, onImport }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackupMenu, setShowBackupMenu] = useState(false);

  // 点击外部区域关闭备份菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBackupMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.backup-menu-container')) {
          setShowBackupMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBackupMenu]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedData: any[] = JSON.parse(text);

        // 验证导入的数据格式
        if (!Array.isArray(importedData) || 
            !importedData.every(item => 
              typeof item === 'object' && 
              'id' in item && 
              'timestamp' in item && 
              'summary' in item && 
              'calories' in item
            )) {
          alert('导入的文件格式不正确');
          return;
        }

        // 转换为 MealRecord 格式
        const importedRecords: MealRecord[] = importedData.map(item => ({
          id: item.id,
          timestamp: item.timestamp,
          summary: item.summary,
          calories: item.calories
        }));

        // 合并数据：如果时间戳相同则覆盖，否则添加新记录
        const existingIds = new Set(history.map(record => record.id));
        const newRecords = [...history];

        for (const importedRecord of importedRecords) {
          const existingIndex = newRecords.findIndex(r => r.timestamp === importedRecord.timestamp);
          if (existingIndex !== -1) {
            // 如果时间戳相同，替换该记录
            newRecords[existingIndex] = importedRecord;
          } else if (!existingIds.has(importedRecord.id)) {
            // 如果ID不存在，添加新记录
            newRecords.push(importedRecord);
          }
        }

        if (onImport) {
          // 通过回调通知父组件更新历史记录
          onImport(newRecords);
        } else {
          alert('导入功能未正确配置，请联系开发者');
        }
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败，请检查文件格式是否正确');
      }
    };
    input.click();
  };

  // 辅助函数：判断日期是否在某个时间段内
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // 周日作为一周开始
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 统计函数
  const getCaloriesStats = () => {
    const todayCalories = history.filter(record => isToday(new Date(record.timestamp))).reduce((sum, record) => sum + record.calories, 0);
    const weekCalories = history.filter(record => isThisWeek(new Date(record.timestamp))).reduce((sum, record) => sum + record.calories, 0);
    const monthCalories = history.filter(record => isThisMonth(new Date(record.timestamp))).reduce((sum, record) => sum + record.calories, 0);
    
    return { todayCalories, weekCalories, monthCalories };
  };

  // 生成本周每日热量数据用于折线图
  const getWeeklyData = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // 周日作为一周开始
    
    // 生成7天的日期数组
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      return date;
    });

    // 按日期计算每日总热量
    const dailyCalories = weekDays.map(day => {
      const dayRecords = history.filter(record => {
        const recordDate = new Date(record.timestamp);
        return isSameDay(recordDate, day);
      });
      return {
        day: day.toLocaleDateString('zh-CN', { weekday: 'short' }),
        calories: dayRecords.reduce((sum, record) => sum + record.calories, 0)
      };
    });

    return dailyCalories;
  };

  // 判断两个日期是否为同一天
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const { todayCalories, weekCalories, monthCalories } = getCaloriesStats();
  const weeklyData = getWeeklyData();

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
          <div className="flex gap-2 relative">
            {!isSelectionMode ? (
              <>
                <div className="relative backup-menu-container">
                  <button
                    onClick={() => setShowBackupMenu(!showBackupMenu)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                    title="备份管理"
                  >
                    <Download size={20} />
                  </button>
                  
                  {showBackupMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                      <button
                        onClick={() => {
                          handleExport();
                          setShowBackupMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        导出备份
                      </button>
                      <button
                        onClick={() => {
                          handleImport();
                          setShowBackupMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        导入备份
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="text-emerald-600 font-medium text-sm px-2"
                >
                  条目管理
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
                    // 全选功能：选择所有可见的记录
                    const visibleRecords = filteredHistory.map(item => item.id);
                    setSelectedIds(new Set(visibleRecords));
                  }}
                  className="text-emerald-600 font-medium text-sm px-2"
                >
                  全选
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
        
        {/* Search */}
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
        </div>
      </div>
      
      {/* 统计卡片区域 - 位于搜索栏下方，记录上方 */}
      <div className="p-4 space-y-4 border-b border-gray-100 bg-gray-50">
        {/* 统计卡片行 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 本日统计 */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-800 text-xs font-medium mb-1">今日热量</div>
            <div className="text-lg font-bold text-blue-900">{todayCalories}</div>
            <div className="text-[10px] text-blue-600">kcal</div>
          </div>
          
          {/* 本周统计 */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3">
            <div className="text-emerald-800 text-xs font-medium mb-1">本周热量</div>
            <div className="text-lg font-bold text-emerald-900">{weekCalories}</div>
            <div className="text-[10px] text-emerald-600">kcal</div>
          </div>
          
          {/* 本月统计 */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
            <div className="text-purple-800 text-xs font-medium mb-1">本月热量</div>
            <div className="text-lg font-bold text-purple-900">{monthCalories}</div>
            <div className="text-[10px] text-purple-600">kcal</div>
          </div>
        </div>
        
        {/* 本周热量折线图 */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">本周每日热量趋势</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="day" 
                  stroke="#666" 
                  tick={{ fontSize: 11 }} 
                  padding={{ left: 5, right: 5 }}
                />
                <YAxis 
                  stroke="#666" 
                  tick={{ fontSize: 11 }} 
                  width={35}
                />
                <Tooltip 
                  formatter={(value) => [`${value} kcal`, '热量']}
                  labelFormatter={(label) => `日期: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-16 space-y-3">
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