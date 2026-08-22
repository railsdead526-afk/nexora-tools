import {
  buildKnowledgeContext,
  searchKnowledge,
} from '@/lib/ai/rag';
import { ensureCoreToolsRegistered } from '@/lib/ai/tools/core-tools';
import { executeTool, listTools } from '@/lib/ai/tool-registry';
import type { AIChatInput, AIProvider, AIStreamChunk } from '../types';

const API_KEY = process.env.OPENAI_API_KEY?.trim();
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const DEFAULT_SYSTEM =
  'You are NexoraAI, a helpful AI assistant inside NexoraTools. Be concise, accurate, practical, and safe. Use the knowledge base when relevant. When the user asks to build a website or UI, provide complete runnable HTML/CSS/JavaScript in fenced code blocks so NexoraAI can preview it. Never reveal secrets or internal configuration.';

type OpenAIToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
};

type OpenAICompletionResponse = {
  choices?: Array<{
    message?: {
      role?: 'assistant';
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }>;
  error?: { message?: string };
};

function streamTextChunks(text: string) {
  return text.match(/\S+\s*/g) || [text];
}

async function createChatCompletion(input: {
  model: string;
  messages: OpenAIMessage[];
  tools: Array<Record<string, unknown>>;
}) {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      tools: input.tools,
      tool_choice: 'auto',
      temperature: 0.2,
    }),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as
    | OpenAICompletionResponse
    | null;

  if (!response.ok || !body?.choices?.length) {
    throw new Error(
      body?.error?.message || 'OpenAI chat completion failed.',
    );
  }

  return body;
}

function toOpenAIMessages(input: AIChatInput, ragContext: string) {
  const systemMessages = input.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean);

  const systemInstruction = [DEFAULT_SYSTEM, ...systemMessages]
    .filter(Boolean)
    .join('\n\n');

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: ragContext
        ? `${systemInstruction}\n\nRelevant knowledge base context:\n${ragContext}`
        : systemInstruction,
    },
  ];

  for (const message of input.messages) {
    if (message.role === 'system') continue;
    messages.push({
      role: message.role,
      content: message.content,
    });
  }

  return messages;
}

export class OpenAIAIProvider implements AIProvider {
  readonly name = 'openai';

  async *chat(input: AIChatInput): AsyncGenerator<AIStreamChunk> {
    try {
      ensureCoreToolsRegistered();
      const model = input.model || DEFAULT_MODEL;
      const lastUserMessage = [...input.messages]
        .reverse()
        .find((message) => message.role === 'user')?.content;

      let ragContext = '';
      if (lastUserMessage?.trim()) {
        try {
          const matches = await searchKnowledge(lastUserMessage, 4);
          ragContext = buildKnowledgeContext(matches);
        } catch (error) {
          console.error('RAG prefetch error:', error);
        }
      }

      const tools = listTools().map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.jsonSchema,
        },
      }));

      const messages = toOpenAIMessages(input, ragContext);

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await createChatCompletion({
          model,
          messages,
          tools,
        });

        const assistant = response.choices?.[0]?.message;
        if (!assistant) {
          throw new Error('OpenAI did not return an assistant message.');
        }

        if (assistant.tool_calls?.length) {
          messages.push({
            role: 'assistant',
            content: assistant.content || '',
            tool_calls: assistant.tool_calls,
          });

          for (const toolCall of assistant.tool_calls) {
            let parsedInput: unknown = {};
            try {
              parsedInput = toolCall.function.arguments
                ? JSON.parse(toolCall.function.arguments)
                : {};
            } catch {
              parsedInput = {};
            }

            try {
              const result = await executeTool(
                toolCall.function.name,
                parsedInput,
              );

              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              });
            } catch (error) {
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Tool execution failed.',
                }),
              });
            }
          }

          continue;
        }

        const text = (assistant.content || '').trim();
        if (!text) {
          throw new Error('OpenAI returned an empty response.');
        }

        for (const chunk of streamTextChunks(text)) {
          yield { type: 'text', text: chunk };
        }

        yield { type: 'done' };
        return;
      }

      yield {
        type: 'error',
        error:
          'NexoraAI berhenti sebelum menghasilkan jawaban akhir setelah pemanggilan tool.',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OpenAI request failed.';
      console.error('OpenAI provider error:', message);
      yield { type: 'error', error: message };
    }
  }
}
