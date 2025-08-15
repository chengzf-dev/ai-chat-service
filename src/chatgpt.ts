// ChatGPT Integration Service
export interface ChatGPTConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ChatGPTService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ChatGPTConfig) {
    this.apiKey = config.apiKey || ''; // Empty token as placeholder
    this.defaultModel = config.model || 'gpt-3.5-turbo';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
  }

  async sendMessage(
    message: string, 
    options?: {
      conversationId?: string;
      model?: string;
      systemPrompt?: string;
    }
  ): Promise<string> {
    // If no API key is provided, return a mock response
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('ChatGPT API key not provided, returning mock response');
      return this.getMockResponse(message);
    }

    const messages: ChatMessage[] = [];
    
    // Add system prompt if provided
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: message
    });

    const requestBody: ChatCompletionRequest = {
      model: options?.model || this.defaultModel,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`ChatGPT API error: ${response.status} - ${errorData}`);
      }

      const data: ChatCompletionResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response from ChatGPT API');
      }
    } catch (error) {
      console.error('ChatGPT API error:', error);
      // Fallback to mock response on error
      return this.getMockResponse(message);
    }
  }

  private getMockResponse(message: string): string {
    const mockResponses = [
      `I understand you said: "${message}". This is a mock response since no API key is configured.`,
      `Thank you for your message: "${message}". Please configure your ChatGPT API key for real responses.`,
      `Mock AI Response: I received your message "${message}" but I'm running in demo mode.`,
      `Hello! You asked: "${message}". This is a placeholder response - please add your OpenAI API key.`
    ];
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  // Method to validate API key
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Method to update API key
  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// Factory function to create ChatGPT service instance
export function createChatGPTService(env: any): ChatGPTService {
  return new ChatGPTService({
    apiKey: env.OPENAI_API_KEY || '', // Will be set via environment variables
    model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(env.MAX_TOKENS || '1000'),
    temperature: parseFloat(env.TEMPERATURE || '0.7')
  });
}