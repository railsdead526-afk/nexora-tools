export type AIModel = string;

export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIChatInput {
  messages: AIMessage[];
  model?: AIModel;
}

export interface AIStreamChunk {
  type: 'text' | 'error' | 'done';
  text?: string;
  error?: string;
}

export interface AIProvider {
  readonly name: string;
  chat(input: AIChatInput): AsyncGenerator<AIStreamChunk>;
}
