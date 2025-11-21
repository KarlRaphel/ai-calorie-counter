import { AppSettings, MealRecord } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getHistory = (): MealRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load history', e);
    return [];
  }
};

export const saveHistory = (history: MealRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};