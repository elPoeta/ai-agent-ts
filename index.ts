import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAgent } from './src/agent/ai/agent'
import { tools } from './src/agent/tools'
import { clearMessages } from './src/agent/ai/memory'
import { openai } from './src/agent/ai/ai'

await clearMessages();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/api/chat', async (req, res) => {
	try {
		const { message, model = 'llama3.2' } = req.body;

		if (!message) {
			return res.status(400).json({ error: 'Message is required' });
		}

		const response = await runAgent({ userMessage: message, tools });
		res.json({
			response: response[response.length - 1].content,
			model,
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({
			error: 'Failed to generate response',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});


app.get('/api/models', async (req, res) => {
	try {
		const models = await openai.models.list();
		const chatModels = models.data
			.map(model => ({
				id: model.id,
				name: model.id,
				created: model.created
			}))
			.sort((a, b) => b.created - a.created);
		res.json(chatModels);
	} catch (error) {
		console.error('Error fetching models:', error);
		// Fallback con modelos conocidos
		res.json([
			{ id: 'llama3.2', name: 'llama 3.2', created: 0 },
		]);
	}
});


app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
	process.exit(1);
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	process.exit(1);
});
