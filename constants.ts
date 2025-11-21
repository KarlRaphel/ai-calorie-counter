
export const DEFAULT_MODEL = 'Qwen/Qwen3-VL-235B-A22B-Instruct';

export const DEFAULT_SYSTEM_INSTRUCTION = `你是一位专业的营养师和卡路里计算助手。
你的任务是通过用户提供的食物照片或文字描述，估算食物的卡路里。
请以友好、鼓励的口吻回答。
在回答时，请给出每种食物的预估热量，以及总热量。
如果信息不足，请礼貌地询问更多细节。
`;

export const STORAGE_KEYS = {
  SETTINGS: 'calorie_app_settings',
  HISTORY: 'calorie_app_history',
};

// Initial state for settings
export const DEFAULT_SETTINGS = {
  apiKey: '',
  baseUrl: 'https://api-inference.modelscope.cn/v1/chat/completions',
  modelName: DEFAULT_MODEL,
  systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
};
