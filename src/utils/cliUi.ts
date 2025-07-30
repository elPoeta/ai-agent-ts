import ora from "ora";
import type { AIMessage } from "../agent/types"

export const showLoader = (text: string) => {
	const spinner = ora({
		text,
		color: "cyan",
	}).start();

	return {
		stop: () => spinner.stop(),
		succeed: (text?: string) => spinner.succeed(text),
		fail: (text?: string) => spinner.fail(text),
		update: (text: string) => (spinner.text = text),
	};
};

export const logMessage = (message: AIMessage) => {
	const roleColors = {
		user: '\x1b[36m', // cyan
		assistant: '\x1b[32m', // green
	}

	const reset = '\x1b[0m'
	const role = message.role
	const color = roleColors[role as keyof typeof roleColors] || '\x1b[37m' // default to white

	// Don't log tool messages
	if (role === 'tool') {
		//console.log("tool calling", message)
		return
	}

	// Log user messages (only have content)
	if (role === 'user') {
		console.log(`\n${color}[ 👤 ]${reset}`)
		console.log(`${message.content}\n`)
		return
	}

	// Log assistant messages
	if (role === 'assistant') {
		// If has tool_calls, log function name and ask for approval if calendar
		if ('tool_calls' in message && message.tool_calls) {
			const log = process.argv[2];
			if (log) {
				message.tool_calls.forEach((tool: any) => {
					console.log(`\n${color}[ 🤖 🔧 ]${reset}`)
					console.log(`${tool.function.name}\n`)

				})
			}
			return
		}

		// If has content, log it
		if (message.content) {
			console.log(`\n${color}[ 🤖 ]${reset}`)
			console.log(`${message.content}\n`)
		}
	}
}


