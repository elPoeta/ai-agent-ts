import OpenAI from "openai";
import { config } from '../../config/config'

export const openai = new OpenAI({
	apiKey: config.ai.apiKey,
	baseURL: config.ai.url
});

