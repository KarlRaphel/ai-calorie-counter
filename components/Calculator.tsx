
import React, { useState, useRef, useEffect } from 'react';
import { Message, AppSettings } from '../types';
import { OpenAIService } from '../services/aiService';
import { Camera, Send, Plus, X, Save, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

interface CalculatorProps {
  settings: AppSettings;
  onSaveMeal: (summary: string, calories: number) => void;
  savedMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
}

const CalculatorTab: React.FC<CalculatorProps> = ({ settings, onSaveMeal, savedMessages, onMessagesUpdate }) => {
  const [messages, setMessages] = useState<Message[]>(
    savedMessages && savedMessages.length > 0 
      ? savedMessages 
      : [{
          id: 'welcome',
          role: 'model',
          text: '你好！我是你的卡路里助手。请上传食物照片或描述你吃的食物，我会帮你计算热量。本项目在Github开源，如果你觉得好用，欢迎点个Star 😘。',
          timestamp: Date.now(),
        }]
  );
  const [hasUserInteraction, setHasUserInteraction] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiService = useRef(new OpenAIService(settings));

  // Re-instantiate service if settings change
  useEffect(() => {
    aiService.current = new OpenAIService(settings);
  }, [settings]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Notify parent component when messages change
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInputImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !inputImage) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      image: inputImage,
      timestamp: Date.now(),
    };

    setHasUserInteraction(true);
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setInputImage(undefined);
    setIsLoading(true);

    try {
      const historyForApi = messages.filter(m => m.id !== 'welcome');
      
      // 创建一个临时的bot消息用于显示流式响应
      const tempBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '',
        timestamp: Date.now(),
      };
      
      // 先添加一个空消息
      setMessages(prev => [...prev, tempBotMessage]);
      
      // 使用流式传输获取响应
      await aiService.current.sendMessageStream(
        newMessage.text || (newMessage.image ? "这图里有多少卡路里？" : ""), 
        newMessage.image,
        historyForApi,
        (chunk) => {
          // 更新临时消息的内容
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempBotMessage.id 
                ? { ...msg, text: msg.text + chunk } 
                : msg
            )
          );
        }
      );
    } catch (error: any) {
      // 如果流式传输失败，移除临时消息并添加错误消息
      setMessages(prev => prev.filter(msg => msg.id !== (Date.now() + 1).toString()));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (messages.length < 2 || isSaving) return;
    setIsSaving(true);
    try {
      const conversation = messages.filter(m => m.id !== 'welcome');
      const result = await aiService.current.summarizeSession(conversation);
      onSaveMeal(result.summary, result.calories);
      // 不再清空聊天记录
    } catch (e) {
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: '你好！我是你的卡路里助手。请上传食物照片或描述你吃的食物，我会帮你计算热量。本项目在Github开源，如果你觉得好用，欢迎点个Star 😘。',
        timestamp: Date.now(),
      },
    ]);
    setHasUserInteraction(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">卡路里计算器</h1>
          <div className="flex items-center gap-2">
            {/* Clear Button - only show when there are real messages */}
            {messages.filter(m => m.id !== 'welcome').length > 0 && (
              <button 
                onClick={handleClearChat}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 transition-all"
                title="清空聊天记录"
              >
                <Trash2 size={14} />
                清空
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={messages.length < 2 || isSaving}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  messages.length < 2 || isSaving
                  ? 'bg-gray-200 text-gray-400' 
                  : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95'
              }`}
          >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              保存记录
          </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Food"
                  className="w-full h-auto max-h-48 object-cover rounded-lg mb-2 border border-black/10"
                />
              )}
              {msg.text}
              {msg.id === 'welcome' && (
                <button
                  onClick={() => window.open('https://github.com/KarlRaphel/ai-calorie-counter', '_blank')}
                  className="block mt-2 text-blue-500 hover:text-blue-700 underline text-xs cursor-pointer"
                >
                  点击访问 GitHub 项目
                </button>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex gap-2 items-center">
             <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[65px] left-0 right-0 bg-white border-t border-gray-200 p-3 z-20">
        {/* Image Preview */}
        {inputImage && (
          <div className="absolute bottom-full left-4 mb-2 bg-white p-1 rounded-lg shadow-lg border border-gray-200 animate-in slide-in-from-bottom-2 z-30">
            <div className="relative">
                <img src={inputImage} alt="Preview" className="h-20 w-20 object-cover rounded" />
                <button 
                    onClick={() => setInputImage(undefined)}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-gray-700"
                >
                    <X size={12} />
                </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
            {/* Hidden File Input */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
            />
            
            {/* Camera Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 flex items-center justify-center text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors shrink-0"
                title="拍照/上传"
            >
                <Camera size={22} />
            </button>

            {/* Text Input Container */}
            <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 min-h-[3rem] py-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={inputImage ? "添加描述..." : "输入食物描述..."}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm max-h-24 resize-none no-scrollbar leading-relaxed flex items-center"
                    rows={1}
                    style={{ height: 'auto' }} 
                />
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !inputImage) || isLoading}
                className={`h-12 w-12 flex items-center justify-center rounded-full transition-all shadow-sm shrink-0 relative ${
                    (!inputText.trim() && !inputImage) || isLoading
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 active:scale-95'
                }`}
            >
                <div className={`absolute transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                    <Send size={20} className="ml-0.5" /> 
                </div>
                {isLoading && <Loader2 size={20} className="absolute animate-spin" />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorTab;
