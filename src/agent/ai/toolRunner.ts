import type OpenAI from 'openai'
import { busquedaDeDisponibilidad, disponibilidadToolDefinition } from '../tools/busquedaDeDisponibilidad'
import { sincronizarGoogleSheetsConDatabase, sincronizarGoogleSheetsConDatabaseToolDefinition } from '../tools/sincronizarDatabase'

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
			return await busquedaDeDisponibilidad(input);

		case sincronizarGoogleSheetsConDatabaseToolDefinition.name:
			return await sincronizarGoogleSheetsConDatabase(input);

		default:
			return `Never run this tool: ${toolCall.function.name} again, or else!`
	}
}
