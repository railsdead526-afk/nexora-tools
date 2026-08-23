import { buildKnowledgeContext, searchKnowledge } from '@/lib/ai/rag';
import {
  getTool,
  listTools,
  registerTool,
} from '@/lib/ai/tool-registry';

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input);
}

function isSearchKnowledgeInput(
  input: unknown,
): input is { query: string; limit?: number } {
  if (!isRecord(input)) return false;
  if (typeof input.query !== 'string' || !input.query.trim()) return false;
  if (
    input.limit !== undefined &&
    (typeof input.limit !== 'number' || !Number.isFinite(input.limit))
  ) {
    return false;
  }
  return true;
}

function isEmptyInput(input: unknown): input is Record<string, never> {
  return isRecord(input) && Object.keys(input).length === 0;
}

let registered = false;

export function ensureCoreToolsRegistered() {
  if (registered) return;

  if (!getTool('search_knowledge')) {
    registerTool({
      name: 'search_knowledge',
      description:
        'Cari knowledge base internal Nexora untuk menemukan konteks, fakta produk, atau dokumentasi yang relevan sebelum menjawab pengguna.',
      permissions: ['database'],
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: {
            type: 'string',
            description: 'Pertanyaan atau topik yang ingin dicari di knowledge base.',
          },
          limit: {
            type: 'number',
            description: 'Jumlah maksimum hasil yang ingin diambil, antara 1 sampai 8.',
          },
        },
        required: ['query'],
      },
      inputSchema: isSearchKnowledgeInput,
      async execute(input) {
        const results = await searchKnowledge(
          input.query,
          Math.max(1, Math.min(Math.round(input.limit || 5), 8)),
        );

        return {
          results,
          context: buildKnowledgeContext(results),
        };
      },
    });
  }

  if (!getTool('list_available_tools')) {
    registerTool({
      name: 'list_available_tools',
      description:
        'Menampilkan daftar tool AI yang tersedia saat ini di backend Nexora.',
      permissions: ['database'],
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      inputSchema: isEmptyInput,
      async execute() {
        return {
          tools: listTools(),
        };
      },
    });
  }

  registered = true;
}
