import { GeminiAIProvider } from './providers/gemini';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  return new GeminiAIProvider();
}
