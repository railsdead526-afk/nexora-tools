import type { AIChatInput, AIProvider, AIStreamChunk } from '../types';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async *chat(input: AIChatInput): AsyncGenerator<AIStreamChunk> {
    const lastMessage = [...input.messages].reverse().find((message) => message.role === 'user');
    const prompt = lastMessage?.content?.trim() || '';

    const response = prompt
      ? `Nexora AI siap menerima: “${prompt}”\n\nProvider AI belum dihubungkan. Fondasi chat sudah aktif dan API key belum diperlukan pada tahap ini.`
      : 'Nexora AI siap. Kirim pesan untuk memulai.';

    for (const word of response.split(/(\s+)/)) {
      yield { type: 'text', text: word };
      await new Promise((resolve) => setTimeout(resolve, 12));
    }

    yield { type: 'done' };
  }
}
