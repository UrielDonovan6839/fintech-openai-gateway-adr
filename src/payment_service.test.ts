import assert from "node:assert/strict";
import { decideRisk, handlePayment } from "./payment_service.js";

const base = { id: "pay_test", accountId: "acct_test", currency: "USD", occurredAt: "2026-01-01T00:00:00.000Z" };
assert.equal(decideRisk({ ...base, amountCents: 99999 }), "approve");
assert.equal(decideRisk({ ...base, amountCents: 100000 }), "review");
const result = await handlePayment({ ...base, amountCents: 100000 });
assert.equal(result.notification.reason, "amount_threshold");
console.log("payment decision test passed");
