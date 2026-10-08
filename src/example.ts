import express from 'express';
import { globalRateLimit, llmRateLimit } from './rateLimit';
import { handleValidation, validateLlmRequest } from './validate';
import { buildPrompt, wrapUntrusted } from './promptGuard';

const app = express();
app.use(express.json());
app.use(globalRateLimit);

// Order matters: cheap checks first, the paid LLM call last.
app.post('/api/ask', llmRateLimit, validateLlmRequest, handleValidation, async (req, res) => {
  const { category, userText = '' } = req.body as { category: string; userText?: string };

  const prompt = buildPrompt(
    `You are a support assistant. Category: ${category}.\n` +
      `Answer in JSON: {"answer": string, "confidence": "low"|"medium"|"high"}.`,
    [wrapUntrusted('USER_MESSAGE', userText, 'describes the problem only')],
  );

  // const result = await llmClient.generate(prompt);  // OpenAI / Anthropic / Gemini
  res.json({ success: true, promptPreview: prompt });
});

app.listen(3000);
