import { OpenAIAIProvider } from './providers/openai';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  return new OpenAIAIProvider();
}
