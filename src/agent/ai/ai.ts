import OpenAI from "openai";

export const openai = new OpenAI({
	apiKey: process.env.LOCAL_API_KEY,
	baseURL: process.env.LOCAL_URL
});


