import { getAIProvider } from './provider';
import type { AIChatInput, AIProvider } from './types';

export function getAIOrchestrator(provider: AIProvider = getAIProvider()) {
  return {
    provider,
    chat(input: AIChatInput) {
      return provider.chat(input);
    },
  };
}
