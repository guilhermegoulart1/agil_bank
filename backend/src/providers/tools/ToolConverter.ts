// Tool converter - converts tools between different provider formats
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface UniversalTool {
  name: string;
  description: string;
  schema: any; // JSON Schema object (already converted from Zod by @openai/agents)
  execute: (input: any, context?: any) => Promise<string>;
}

export class ToolConverter {
  /**
   * Extracts a tool from @openai/agents format to universal format
   */
  static fromOpenAIAgentsTool(tool: any): UniversalTool {
    return {
      name: tool.name,
      description: tool.description,
      schema: tool.parameters,
      execute: tool.execute,
    };
  }

  /**
   * Converts a universal tool to OpenAI function calling format (for OpenRouter)
   */
  static toOpenAIFunction(tool: UniversalTool) {
    return {
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      },
    };
  }

  /**
   * Converts a universal tool to Google ADK tool format
   * Note: This is a placeholder - actual Google ADK integration may require different structure
   */
  static toGoogleADKTool(tool: UniversalTool) {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.schema as any),
      handler: tool.execute,
    };
  }
}
