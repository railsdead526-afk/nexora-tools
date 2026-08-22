export type ToolPermission = 'network' | 'code' | 'files' | 'database';

export type ToolDefinition<TInput = unknown, TOutput = unknown> = {
  name: string;
  description: string;
  permissions: ToolPermission[];
  jsonSchema: Record<string, unknown>;
  inputSchema: (input: unknown) => input is TInput;
  execute: (input: TInput) => Promise<TOutput>;
};

const registry = new Map<string, ToolDefinition>();

export function registerTool<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>) {
  if (registry.has(tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`);
  }
  registry.set(tool.name, tool as ToolDefinition);
}

export function getTool(name: string) {
  return registry.get(name);
}

export function listTools() {
  return Array.from(registry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    permissions: tool.permissions,
    jsonSchema: tool.jsonSchema,
  }));
}

export async function executeTool(name: string, input: unknown) {
  const tool = registry.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  if (!tool.inputSchema(input)) throw new Error(`Invalid input for tool: ${name}`);
  return tool.execute(input);
}
