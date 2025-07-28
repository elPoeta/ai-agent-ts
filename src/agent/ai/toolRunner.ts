import type OpenAI from 'openai'
import { disponibilidadSearch, disponibilidadToolDefinition } from '../tools/disponibilidadSearch'

export const runTool = async (
	toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
	userMessage: string
) => {
	const input = {
		userMessage,
		toolArgs: JSON.parse(toolCall.function.arguments || '{}'),
	}

	switch (toolCall.function.name) {

		case disponibilidadToolDefinition.name:
			return disponibilidadSearch(input);

		default:
			return `Never run this tool: ${toolCall.function.name} again, or else!`
	}
}
