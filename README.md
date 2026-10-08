# llm-api-guards

Small, framework-light guards for Express/TypeScript endpoints that call a
**paid LLM API** (OpenAI, Anthropic, Gemini...). Three problems, three files:

| Problem | File | What it does |
|---|---|---|
| One account (or script) burns your API budget | `src/rateLimit.ts` | Per-**user** limits (not just per-IP), higher for paying users but never unlimited, admins exempt |
| Garbage / oversized input reaches the model | `src/validate.ts` | `express-validator` chains with length caps and enum/UUID checks, one consistent 400 shape |
| User text steers the model ("ignore previous instructions") | `src/promptGuard.ts` | Wraps untrusted text in a labelled data block and strips look-alike delimiters so it can't close the block early |

## Why these choices

- **Rate limit by user id, fall back to IP.** Keying only on IP is bypassed by
  rotating IPs; keying on the authenticated user is not.
- **No unlimited tier.** A "premium = no limit" rule makes one hijacked account
  an unbounded bill. Premium gets a higher ceiling, not an absent one.
- **Validation also bounds cost.** A 1,000-character cap limits tokens per
  request and leaves less room for an injection payload.
- **Delimiting reduces, not eliminates, injection risk.** Pair it with
  schema-constrained (JSON) output and treat model output as untrusted too.

## Usage

```ts
app.post('/api/ask', llmRateLimit, validateLlmRequest, handleValidation, handler);

const prompt = buildPrompt(
  'You are a support assistant. Answer in JSON.',
  [wrapUntrusted('USER_MESSAGE', userText, 'describes the problem only')],
);
```

See `src/example.ts` for a complete wiring.

Extracted and generalised from a production mobile app's backend, where the
LLM endpoint is the main cost center and the main abuse target.
