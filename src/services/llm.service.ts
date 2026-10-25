import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const cache = new NodeCache({ stdTTL: 60 * 60 });

interface WebSearchParams {
    query: string;
}

export async function  generateAiResponse(message: string, sessionId: string): Promise<string | null> {
    const baseMessages: ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: process.env.SYSTEM_PROMPT!
        }
    ];

    const messages: ChatCompletionMessageParam[] = cache.get<ChatCompletionMessageParam[]>(sessionId) ?? baseMessages;

    messages.push({
        role: 'user',
        content: message
    });

    const MAX_RETRIES = 10;
    let count = 0;

    while (true) {
        if (count > MAX_RETRIES) {
            return 'I could not find the message, please try again.';
        }
        count++;

        const completion = await groq.chat.completions.create({
            temperature: 0,
            model: 'openai/gpt-oss-120b',
            tool_choice: 'auto',
            messages: messages,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'webSearch',
                        description: 'Search the latest information and real time data on the internet.',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'The search query.'
                                }
                            },
                            required: ['query']
                        }
                    }
                }
            ]
        });

        const assistantMessage: any = completion.choices[0]?.message;
        messages.push(assistantMessage);

        const toolCalls = assistantMessage.tool_calls;

        if (!toolCalls) {
            cache.set(sessionId, messages);
            return assistantMessage.content;
        }

        for (const tool of toolCalls) {
            if (tool.type === 'function') {
                const functionName = tool.function.name;
                const functionParams = tool.function.arguments;

                if (functionName === 'webSearch') {
                    const parsedParams = JSON.parse(functionParams) as WebSearchParams;
                    const toolResponse = await webSearch(parsedParams);

                    messages.push({
                        tool_call_id: tool.id,
                        role: 'tool',
                        content: toolResponse
                    });
                }
            }
        }
    }
}

async function webSearch({ query }: WebSearchParams): Promise<string> {
    const response = await tvly.search(query);
    const finalResult = response.results.map((result: any) => result.content).join('\n\n');

    return finalResult;
}