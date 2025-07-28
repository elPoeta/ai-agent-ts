import 'dotenv/config'
import { runAgent } from './src/agent/ai/agent'
import { tools } from './src/agent/tools'
import { clearMessages } from './src/agent/ai/memory'

import { queryDisponibilidad } from './src/db/search'

const userMessage = process.argv[2]

if (!userMessage) {
	console.error('Please provide a message')
	process.exit(1)
}

await clearMessages();

await runAgent({ userMessage, tools });


//const results = await queryDisponibilidad('2025-02-13', '2025-02-21');

//console.log("# ",results);
