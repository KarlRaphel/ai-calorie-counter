
import { Message, AppSettings, AnalysisResult } from '../types';

export class OpenAIService {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  // --- OpenAI API Helpers ---
  private formatMessagesOpenAI(messages: Message[], systemInstruction: string) {
    const formatted = messages.map(msg => {
      if (msg.role === 'model') {
        return { role: 'assistant', content: msg.text };
      }
      
      const content: any[] = [];
      if (msg.text) {
        content.push({ type: "text", text: msg.text });
      }
      if (msg.image) {
        content.push({
          type: "image_url",
          image_url: {
            url: msg.image 
          }
        });
      }
      return { role: 'user', content };
    });

    if (systemInstruction) {
      formatted.unshift({ role: 'system', content: systemInstruction });
    }
    
    return formatted;
  }

  private async callOpenAI(messages: any[]): Promise<string> {
    if (!this.settings.apiKey) throw new Error("Missing API Key");
    
    let url = this.settings.baseUrl || '';
    
    // Smart URL handling:
    // If user provides "https://.../v1", append "/chat/completions"
    // If user provides "https://.../chat/completions", use as is
    if (!url.includes('/chat/completions')) {
        url = url.replace(/\/$/, ''); // Remove trailing slash
        url = `${url}/chat/completions`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.modelName,
        messages: messages,
        max_tokens: 1000 // Reasonable default
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request Failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response content";
  }

  // --- Public Methods ---

  async sendMessage(
    text: string,
    imageBase64: string | undefined,
    previousMessages: Message[]
  ): Promise<string> {
    if (!this.settings.apiKey) {
      throw new Error("请先在设置中配置 API Key");
    }

    const currentMessage: Message = {
        id: 'temp',
        role: 'user',
        text: text,
        image: imageBase64,
        timestamp: Date.now()
    };
    // Combine previous + current
    const allMessages = [...previousMessages, currentMessage];
    const openAIMessages = this.formatMessagesOpenAI(allMessages, this.settings.systemInstruction);
    return this.callOpenAI(openAIMessages);
  }

  async summarizeSession(messages: Message[]): Promise<AnalysisResult> {
    if (!this.settings.apiKey) throw new Error("API Key missing");
    
    const summaryPromptText = `
      请回顾上述关于食物的对话。
      请总结这顿饭的以下信息并以严格的 JSON 格式返回：
      1. summary: 食物内容的简短摘要（中文）。
      2. calories: 估算的总热量数值（仅数字，单位kcal）。
      
      格式示例：
      {
        "summary": "一碗牛肉面和一个煎蛋",
        "calories": 650
      }
      不要包含 Markdown 格式标记（如 \`\`\`json），只返回纯 JSON 字符串。
    `;

    const promptMessage: Message = {
         id: 'summary',
         role: 'user',
         text: summaryPromptText,
         timestamp: Date.now()
    };
    const openAIMessages = this.formatMessagesOpenAI([...messages, promptMessage], this.settings.systemInstruction);
    
    let resultText = "";
    try {
         resultText = await this.callOpenAI(openAIMessages);
    } catch (e) {
        console.error("OpenAI Summary failed", e);
        return { summary: "分析失败", calories: 0 };
    }

    try {
        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
            summary: parsed.summary || "未知食物",
            calories: typeof parsed.calories === 'number' ? parsed.calories : 0
        };
    } catch (e) {
        console.error("JSON parse failed", e);
        return { summary: "数据解析失败", calories: 0 };
    }
  }
}
