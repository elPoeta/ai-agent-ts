import '@dotenvx/dotenvx/config'
import { runAgent } from './src/agent/ai/agent'
import { tools } from './src/agent/tools'
import { clearMessages } from './src/agent/ai/memory'

const userMessage = process.argv[2]

if (!userMessage) {
	console.error('Please provide a message')
	process.exit(1)
}

await clearMessages();

await runAgent({ userMessage, tools });

