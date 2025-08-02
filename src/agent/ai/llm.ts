import type { AIMessage } from "../types";
import { openai } from './ai'
import { systemPrompt as defaultSystemPrompt } from '../ai/systemPrompt';
import { z } from 'zod4'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'


export const runLLM = async ({
	messages,
	tools = [],
	temperature = 0.1,
	systemPrompt,
}: {
	messages: AIMessage[]
	tools?: any[]
	temperature?: number
	systemPrompt?: string
}) => {
	const formattedTools: ChatCompletionTool[] = tools.map(tool => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: z.toJSONSchema(tool.parameters),
		},
	}));

	const model = process.env.MODEL || "";

	// Configuración condicional de tool_choice
	const chatConfig: any = {
		model,
		temperature,
		messages: [
			{ role: 'system', content: systemPrompt || defaultSystemPrompt },
			...messages,
		],
		parallel_tool_calls: false,
	};

	// Solo agregar tools y tool_choice si hay herramientas disponibles
	if (tools.length > 0) {
		chatConfig.tools = formattedTools;
		chatConfig.tool_choice = 'auto';
	}

	const response = await openai.chat.completions.create(chatConfig);
	return response.choices[0].message;
}


/*
export const runLLM = async ({
	messages,
	tools = [],
	temperature = 0.1,
	systemPrompt,
}: {
	messages: AIMessage[]
	tools?: any[]
	temperature?: number
	systemPrompt?: string
}) => {
	const formattedTools: ChatCompletionTool[] = tools.map(tool => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: z.toJSONSchema(tool.parameters),
		},
	}));

	const model = process.env.MODEL || "";

	const response = await openai.chat.completions.create({
		model,
		temperature,
		messages: [
			{ role: 'system', content: systemPrompt || defaultSystemPrompt },
			...messages,
		],
		tools: formattedTools,
		tool_choice: 'auto',
		parallel_tool_calls: false,
	});


	return response.choices[0].message

}
*/
/*
export const runLLM = async ({
	messages,
	tools = [],
	temperature = 0.1,
	systemPrompt,
}: {
	messages: AIMessage[]
	tools?: any[]
	temperature?: number
	systemPrompt?: string
}) => {
    
	const formattedTools = tools.map(zodFunction)
	const model = process.env.LOCAL_MODEL || "";

	const response = await openai.chat.completions.create({
		model,
		temperature,
		messages: [
			{
				role: 'system',
				content: systemPrompt || defaultSystemPrompt,
			},
			...messages,
		],
		...(formattedTools.length > 0 && {
			tools: formattedTools,
			tool_choice: 'auto',
			parallel_tool_calls: false,
		}),

	})

	return response.choices[0].message
}
*/
