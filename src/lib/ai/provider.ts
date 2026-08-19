import { MockAIProvider } from './providers/mock';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  return new MockAIProvider();
}
