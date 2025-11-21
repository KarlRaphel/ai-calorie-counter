export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  timestamp: number;
}

export interface MealRecord {
  id: string;
  timestamp: number;
  summary: string;
  calories: number;
}

export interface AppSettings {
  apiKey: string;
  baseUrl?: string;
  modelName: string;
  systemInstruction: string;
}

export enum Tab {
  CALCULATOR = 'calculator',
  HISTORY = 'history',
  SETTINGS = 'settings',
}

export interface AnalysisResult {
  summary: string;
  calories: number;
}