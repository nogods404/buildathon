const OpenAI = require("openai");

let openai = null;

function initOpenAI() {
	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		console.log(
			"⚠️  OpenAI API key not configured. AI parsing disabled, using regex fallback.",
		);
		return null;
	}

	openai = new OpenAI({ apiKey });
	console.log("✅ OpenAI initialized");
	return openai;
}

// Parse any natural language command to extract amount and recipient
async function parseCommandWithAI(command) {
	// First try regex as fallback (fast and free)
	const regexResult = parseWithRegex(command);

	// If no OpenAI configured, use regex result
	if (!openai) {
		return regexResult;
	}

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `You are a payment command parser. Extract the amount (in ETH) and recipient Telegram handle from user messages.

Rules:
- Amount should be a number (can be decimal like 0.01, 0.5, 1.5)
- Recipient is a Telegram handle (usually starts with @ but not always)
- If you can't find both amount AND recipient, return null for both
- Return ONLY valid JSON, no explanation

Examples:
"send 0.01 eth to @alice" -> {"amount": 0.01, "recipient": "alice"}
"pay bob 0.5" -> {"amount": 0.5, "recipient": "bob"}
"@john needs 2 eth" -> {"amount": 2, "recipient": "john"}
"transfer 0.1 to alice" -> {"amount": 0.1, "recipient": "alice"}
"give @mike 0.05 eth please" -> {"amount": 0.05, "recipient": "mike"}
"I want to send some money to bob" -> {"amount": null, "recipient": null}
"hello" -> {"amount": null, "recipient": null}`,
				},
				{
					role: "user",
					content: command,
				},
			],
			temperature: 0,
			max_tokens: 100,
		});

		const content = response.choices[0].message.content.trim();
		console.log(`AI parsed "${command}" -> ${content}`);

		const parsed = JSON.parse(content);

		if (parsed.amount && parsed.recipient) {
			return {
				success: true,
				amount: parseFloat(parsed.amount),
				recipient: parsed.recipient.replace("@", "").toLowerCase(),
			};
		}

		// AI couldn't parse, fall back to regex
		return regexResult;
	} catch (error) {
		console.error("AI parsing error:", error.message);
		// Fall back to regex
		return regexResult;
	}
}

// Regex fallback parser
function parseWithRegex(command) {
	const patterns = [
		/(?:send|pay|transfer|give)\s+(\d+(?:\.\d+)?)\s*(?:eth)?\s+to\s+@?(\w+)/i,
		/(?:send|pay|transfer|give)\s+@?(\w+)\s+(\d+(?:\.\d+)?)\s*(?:eth)?/i,
		/@(\w+)\s+.*?(\d+(?:\.\d+)?)\s*(?:eth)?/i,
		/(\d+(?:\.\d+)?)\s*(?:eth)?\s+.*?@(\w+)/i,
	];

	for (let i = 0; i < patterns.length; i++) {
		const match = command.match(patterns[i]);
		if (match) {
			// Pattern 0: amount first, then recipient
			// Pattern 1: recipient first, then amount
			// Pattern 2: @recipient then amount
			// Pattern 3: amount then @recipient

			let amount, recipient;
			if (i === 0 || i === 3) {
				amount = parseFloat(match[1]);
				recipient = match[2].toLowerCase();
			} else {
				recipient = match[1].toLowerCase();
				amount = parseFloat(match[2]);
			}

			return {
				success: true,
				amount,
				recipient,
			};
		}
	}

	return {
		success: false,
		error:
			'Could not understand command. Try something like "send 0.01 eth to @username"',
	};
}

module.exports = {
	initOpenAI,
	parseCommandWithAI,
};
