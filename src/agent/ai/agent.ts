import { runLLM } from "./llm";
import { addMessages, getMessages, saveToolResponse } from './memory'
import { runTool } from "./toolRunner"
import { detectAvailabilityQuery } from '../tools/toolDetection'
import { config } from '../../config/config'
import { type AIMessage } from '../types'
export type ModelKey = "llama3.2" | "gemini-2.0.flash";
import OpenAI from "openai";

export const runAgent = async ({
	userMessage,
	tools,
}: {
	userMessage: string
	tools: any[],
}) => {
	await addMessages([{ role: 'user', content: userMessage }])
	while (true) {
		const history = await getMessages()

		// Decidir si usar tools basado en el contenido del mensaje
		const shouldUseTools = !config.ai.smart ? detectAvailabilityQuery.basic(userMessage) : true;
		const toolsToUse = shouldUseTools ? tools : []


		const response = await runLLM({
			messages: history,
			tools: toolsToUse
		})

		await addMessages([response as AIMessage])

		if ((response as AIMessage)?.content) {
			return getMessages()
		}

		const message = response as OpenAI.ChatCompletionMessage;

		if (message.tool_calls && message.tool_calls.length > 0) {
			const toolCall = message.tool_calls[0];
			const toolResponse = await runTool(toolCall, userMessage);
			await saveToolResponse(toolCall.id, toolResponse);
		}
	}
}


