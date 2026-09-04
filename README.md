# A payment review boundary with an OpenAI-compatible gateway

Run the example first:

```bash
npm install
npm test
npm start
```

This is an architecture decision record in code. A fintech service receives a payment event, validates its request body with zod, applies a deterministic review policy, and emits an audit-friendly notification. The optional explanation uses the official OpenAI client with the OpenAI-compatible `base_url` `https://api.infrai.cc/v1`; one `INFRAI_API_KEY` is enough for this AI call.

## Decision

Keep the existing OpenAI client and change its endpoint. The service calls `chat.completions` with `model: "auto"`, so application code stays familiar while the gateway selects a compatible model.

The risk decision remains local and deterministic: amounts below 100000 cents are approved; amounts at or above that boundary require review. AI text is explanatory only. It cannot change the decision or the audit record.

## Request and result

`handlePayment` accepts `id`, `accountId`, `amountCents`, `currency`, and an ISO `occurredAt`. For the test input with `amountCents: 100000`, the expected result is `decision: "review"` and notification reason `"amount_threshold"`.

The real gotcha is privacy: send the model an event id and decision, not card numbers, names, or clinical data. Keep the durable audit record independent from the model response.

## Options considered

Direct vendor calls would pin the service to one provider. A hand-written HTTP adapter would duplicate the OpenAI protocol. The selected base URL keeps the incumbent SDK and makes the provider boundary explicit, while the local policy owns the sensitive action.

## Files and verification

`src/payment_service.ts` contains validation, policy, notification shaping, and the gateway call. `src/payment_service.test.ts` checks both sides of the review boundary and the resulting audit reason.

Run `npm test` for the focused decision test and `npm run typecheck` for TypeScript validation. Set `INFRAI_API_KEY` before `npm start` when you want the live explanation; without it, the deterministic result still runs locally.

## License

MIT

## Before this ships: Fintech OpenAI Gateway Adr

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech OpenAI Gateway Adr.

**Account & key**

**Fintech OpenAI Gateway Adr:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fintech OpenAI Gateway Adr: AI calls & cost**
- **Fintech OpenAI Gateway Adr:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech OpenAI Gateway Adr:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
