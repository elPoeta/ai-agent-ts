import { showLoader, logMessage } from "../../utils/cliUi";
import { runLLM } from "./llm";
import { addMessages, getMessages, saveToolResponse } from './memory'
import { runTool } from "./toolRunner"
import { detectAvailabilityQuery } from '../tools/toolDetection'


export const runAgent = async ({
	userMessage,
	tools,
}: {
	userMessage: string
	tools: any[]
}) => {
	await addMessages([{ role: 'user', content: userMessage }])
	const loader = showLoader('🤔')

	while (true) {
		const history = await getMessages()

		// Decidir si usar tools basado en el contenido del mensaje
		const shouldUseTools = process.env.SMART === 'false' ? detectAvailabilityQuery.basic(userMessage) : true;
		const toolsToUse = shouldUseTools ? tools : []

		// Log para debugging (puedes remover después)
		//console.log(`[DEBUG] Should use tools: ${shouldUseTools}`)
		//console.log(`[DEBUG] Tools count: ${toolsToUse.length}`)

		const response = await runLLM({
			messages: history,
			tools: toolsToUse
		})

		await addMessages([response])

		if (response.content) {
			loader.stop()
			logMessage(response)
			return getMessages()
		}

		if (response.tool_calls) {
			const toolCall = response.tool_calls[0]
			logMessage(response)
			loader.update(`executing: ${toolCall.function.name}`)
			const toolResponse = await runTool(toolCall, userMessage)
			await saveToolResponse(toolCall.id, toolResponse)
			loader.update(`done: ${toolCall.function.name}`)
		}
	}
}


/*
export const runAgent = async ({
	userMessage,
	tools,
}: {
	userMessage: string
	tools: any[]
}) => {

	await addMessages([{ role: 'user', content: userMessage }])

	const loader = showLoader('🤔')

	while (true) {
		const history = await getMessages()
		const response = await runLLM({ messages: history, tools })

		await addMessages([response])

		if (response.content) {
			loader.stop()
			logMessage(response)
			return getMessages()
		}

		if (response.tool_calls) {
			const toolCall = response.tool_calls[0]
			logMessage(response)
			loader.update(`executing: ${toolCall.function.name}`)

			const toolResponse = await runTool(toolCall, userMessage)
			await saveToolResponse(toolCall.id, toolResponse)
			loader.update(`done: ${toolCall.function.name}`)
		}
	}


}
*/
