import '@dotenvx/dotenvx/config'
import { runAgent } from './src/agent/ai/agent'
import { tools } from './src/agent/tools'
import { clearMessages } from './src/agent/ai/memory'
import figlet from 'figlet';
import { input } from '@inquirer/prompts'
import chalk from 'chalk'


await clearMessages();

console.log(chalk.bold.green(figlet.textSync('HOSTER-IA')));

let userMessage: string;

const prompt = async () => {

	do {
		userMessage = await input({ message: '👤 >' });

		if (userMessage.toLowerCase() !== 'q') {
			await runAgent({ userMessage, tools });
		}

	} while (userMessage.toLowerCase() !== 'q');

}

prompt();

