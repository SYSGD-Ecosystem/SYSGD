import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openRouter = new OpenRouter({
	apiKey: OPENROUTER_API_KEY,
});

const generate = async (model: string, prompt: string, systemPrompt: string) => {
	const completion = await openRouter.chat.send({
		model,
		messages: [
            {
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: prompt,
			},
		],
		stream: false,
	});

	console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
};

export { openRouter, generate };
