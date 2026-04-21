import { withRetry } from './retry';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[], onChunk?: (chunk: string) => void) {
  const baseUrl = process.env.LLM_BASE_URL || 'http://localhost:3000/api';
  const model = process.env.LLM_MODEL || 'llama3.1';
  const apiKey = process.env.LLM_API_KEY || '';

  return withRetry(async () => {
    console.log(`[LLM] Calling ${baseUrl}/chat/completions with model ${model} (Streaming: ${!!onChunk})`);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1, 
        stream: !!onChunk
      }),
      signal: AbortSignal.timeout(180000) 
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("LLM Authentication Failed: Your API Key (LLM_API_KEY) in .env.local is missing or invalid.");
      }
      const error = await response.json();
      throw new Error(`LLM Error: ${error.detail || response.statusText} (${response.status})`);
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }, 3, 2000);
}
