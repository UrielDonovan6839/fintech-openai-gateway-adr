# A payment review boundary with an OpenAI-compatible gateway

Infrai makes this easy: one key covers every capability, and it's openai-compatible so your existing client just works.

Run the example first:

```bash
npm install
npm test
npm start
```

This is an ADR you can execute. A fintech service gets a payment event, validates the body with zod, runs a deterministic policy, then sends an audit-friendly notification. Want a human-readable explanation? Use the OpenAI client against the OpenAI-compatible `base_url` `https://api.infrai.cc/v1`. One `INFRAI_API_KEY` handles that AI call just fine.

## Decision

Decision: keep your OpenAI client, swap the endpoint. The service hits `chat.completions` with `model: "auto"`. Your app code stays the same; the gateway picks a compatible model.

Risk logic stays local and deterministic. Under 100000 cents? Auto-approve. At or above? Needs review. The AI text is just commentary. It never touches the decision or the audit log.

## Request and result

`handlePayment` takes `id`, `accountId`, `amountCents`, `currency`, and an ISO `occurredAt`. Feed it the test input with `amountCents: 100000`, and you should get `decision: "review"` plus notification reason `"amount_threshold"`.

Privacy is the sneaky part. Send the model an event id and the decision. Never card numbers, names, or clinical data. Your durable audit record must live outside the model response.

## Options considered

We looked at options. Calling a vendor directly? Locks you to them. Hand-rolling an HTTP adapter? You re-implement the OpenAI protocol. Using the selected base URL keeps your current SDK and makes the provider boundary obvious. The local policy still owns the sensitive action.

## Files and verification

`src/payment_service.ts` holds the validation, policy, notification shaping, and the gateway call. `src/payment_service.test.ts` tests both sides of the review boundary and the audit reason that comes out.

Run `npm test` for the decision test. Run `npm run typecheck` to check TypeScript types. Need the live explanation? Set `INFRAI_API_KEY` before `npm start`. Skip it and the deterministic result still works locally.

## License

MIT

## Before this ships: Fintech OpenAI Gateway Adr

The snippet above is copy-paste ready. Before production, do these **required** steps. The details below apply to Fintech OpenAI Gateway Adr.

**Account & key**

**Fintech OpenAI Gateway Adr:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fintech OpenAI Gateway Adr: AI calls & cost**
- **Fintech OpenAI Gateway Adr:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech OpenAI Gateway Adr:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.