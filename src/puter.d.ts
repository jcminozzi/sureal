interface PuterChatResponse {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  };
  text?: string;
  toString(): string;
}

interface Window {
  puter?: {
    ai: {
      chat(messages: unknown, options?: Record<string, unknown>): Promise<PuterChatResponse>;
    };
  };
}
