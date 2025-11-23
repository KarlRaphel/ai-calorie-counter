
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Save, AlertCircle, Server } from 'lucide-react';
import Header from './Header';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsTab: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <Header title="设置" />

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Configuration */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Server size={20} className="text-emerald-600" />
              接口配置
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder="your_api_key"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Base URL / 接口地址
                </label>
                <input
                  type="text"
                  name="baseUrl"
                  value={formData.baseUrl || ''}
                  onChange={handleChange}
                  placeholder="https://api-inference.modelscope.cn/v1/chat/completions"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  OpenAI 兼容接口，请填写完整 Endpoint。
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  模型名称
                </label>
                <input
                  type="text"
                  name="modelName"
                  value={formData.modelName}
                  onChange={handleChange}
                  placeholder="your_model"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  ⭐️ 设置完了记得划到下面点一下保存！
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                所有配置仅存储在本地浏览器中。请确保自定义接口支持 CORS 跨域访问。
              </p>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              默认提示词 (System Instruction)
            </label>
            <textarea
              name="systemInstruction"
              value={formData.systemInstruction}
              onChange={handleChange}
              rows={5}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            <Save size={20} />
            保存配置
          </button>
        </form>
      </div>

      {/* Success Toast */}
      <div
        className={`fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 z-[60] flex items-center gap-2 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
      >
        <span className="font-medium">设置已保存</span>
      </div>
    </div>
  );
};

export default SettingsTab;
