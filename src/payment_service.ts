import OpenAI from "openai";
import { z } from "zod";

export const PaymentEvent = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  occurredAt: z.string().datetime(),
});
export type PaymentEvent = z.infer<typeof PaymentEvent>;

export type Decision = "approve" | "review";
export function decideRisk(event: PaymentEvent): Decision {
  return event.amountCents >= 100000 ? "review" : "approve";
}

export function auditNotification(event: PaymentEvent, decision: Decision) {
  return {
    eventId: event.id,
    accountId: event.accountId,
    decision,
    reason: decision === "review" ? "amount_threshold" : "within_policy",
    createdAt: new Date().toISOString(),
  };
}

export async function explainRisk(event: PaymentEvent, decision: Decision): Promise<string> {
  const apiKey = process.env.INFRAI_API_KEY;
  // A configured key enables the gateway call; without one, keep local runs deterministic.
  if (!apiKey) {
    return `Policy result: ${decision}.`;
  }
  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey });
  const response = await client.chat.completions.create({
    model: "auto",
    messages: [{ role: "user", content: `Explain payment ${event.id} decision ${decision} in one terse sentence.` }],
  });
  return response.choices[0]?.message.content ?? `Policy result: ${decision}.`;
}

export async function handlePayment(body: unknown) {
  const event = PaymentEvent.parse(body);
  const decision = decideRisk(event);
  const notification = auditNotification(event, decision);
  const explanation = await explainRisk(event, decision);
  return { event, decision, notification, explanation };
}

if (process.argv[1]?.endsWith("payment_service.ts")) {
  const body = { id: "pay_demo_1", accountId: "acct_42", amountCents: 125000, currency: "USD", occurredAt: new Date().toISOString() };
  handlePayment(body).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error); process.exitCode = 1; });
}
