import { openai } from '../ai/ai'
import type { AIMessage } from "../types";
import { systemPrompt as defaultSystemPrompt } from '../ai/systemPrompt';
import { z } from 'zod4'
import { config } from '../../config/config'

export const runLLM = async ({
	messages,
	tools = [],
	temperature = 0.1,
	systemPrompt,
}: {
	messages: AIMessage[]
	tools?: any[]
	temperature?: number
	systemPrompt?: string,
}) => {
	const formattedTools = tools.map(tool => {
		const params = tool.parameters instanceof z.ZodType
			? z.toJSONSchema(tool.parameters)
			: tool.parameters

		// Si no tiene properties, le agregamos un confirm opcional
		if (params?.type === 'object' && Object.keys(params.properties || {}).length === 0) {
			params.properties = { confirm: { type: 'boolean', description: 'Confirmar ejecución' } }
			params.required = []
		}

		return {
			type: 'function',
			function: {
				name: tool.name,
				description: tool.description,
				parameters: params,
			}
		}
	})

	const model = config.ai.model;

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
	try {
		const response = await openai.chat.completions.create(chatConfig);
		return response.choices[0].message;
	} catch (error) {
		console.error("error-response", error);
		return [{ content: "* Error!, No se pudo completar la solicitud." }]
	}
}


