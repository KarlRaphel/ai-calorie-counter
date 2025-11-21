import React, { useState, useEffect } from 'react';
import { Tab, AppSettings, MealRecord } from './types';
import { getSettings, saveSettings, getHistory, saveHistory } from './utils/storage';
import BottomNav from './components/BottomNav';
import CalculatorTab from './components/Calculator';
import HistoryTab from './components/History';
import SettingsTab from './components/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CALCULATOR);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [history, setHistory] = useState<MealRecord[]>(getHistory());

  useEffect(() => {
    // Sync initial load
    setSettings(getSettings());
    setHistory(getHistory());
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveMeal = (summary: string, calories: number) => {
    const newRecord: MealRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      summary,
      calories,
    };
    const updatedHistory = [...history, newRecord];
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
    setActiveTab(Tab.HISTORY);
  };

  const handleDeleteHistory = (ids: string[]) => {
    const updatedHistory = history.filter(record => !ids.includes(record.id));
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const handleUpdateHistory = (updatedRecords: MealRecord[]) => {
    setHistory(updatedRecords);
    saveHistory(updatedRecords);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CALCULATOR:
        return <CalculatorTab settings={settings} onSaveMeal={handleSaveMeal} />;
      case Tab.HISTORY:
        return <HistoryTab history={history} onDelete={handleDeleteHistory} onImport={handleUpdateHistory} />;
      case Tab.SETTINGS:
        return <SettingsTab settings={settings} onSave={handleSaveSettings} />;
      default:
        return <CalculatorTab settings={settings} onSaveMeal={handleSaveMeal} />;
    }
  };

  // Check for API key on first load if not in settings, but available in env
  useEffect(() => {
    if (!settings.apiKey && process.env.API_KEY) {
        const updated = { ...settings, apiKey: process.env.API_KEY };
        setSettings(updated);
        // We don't save env key to local storage to avoid persistence confusion, 
        // or we could. Here we just update state.
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      <main className="flex-1 w-full max-w-md mx-auto bg-white shadow-2xl h-full relative overflow-hidden">
         {/* 
            Constraining max-width to mobile size on desktop for better PWA feel.
            On mobile, w-full takes over.
         */}
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
};

export default App;