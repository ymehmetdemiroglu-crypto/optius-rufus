---
title: Paddle webhook mismatch
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
severity: high
---

# Paddle webhook mismatch

> **Stub.** The local subscription state is out of sync with Paddle. Customers report being charged but not seeing entitlements.

## Symptom

- Customers in Paddle show `active` but local `prospects.status` is `prospect` or `payment_failed`
- Webhook events arriving but not updating the DB
- `PADDLE_WEBHOOK_SECRET` rotation appears to have broken signature verification

## Likely cause

| Cause | Indicator |
|---|---|
| Webhook secret rotated without app restart | 401s in `paddle` domain logs |
| Handler exception | Specific event type silently failing in Sentry |
| Paddle outage | Status page shows incident |

## Fix (planned)

1. Verify `PADDLE_WEBHOOK_SECRET` in env matches the Paddle dashboard.
2. Restart the app to pick up the new secret.
3. Use the Paddle "Resend webhook" button for the affected events.
4. If the local DB is irrecoverable, re-sync via `pnpm exec tsx scripts/paddle-resync.ts --from <timestamp>` (script TBD).

## Verify

```bash
pnpm exec tsx scripts/paddle-resync.ts --check <customer-email>
```

Returns `in_sync: true` when local state matches Paddle.

## Related

- [Env vars reference](../30-reference/env/variables.md)
- [Domain catalog: booking](../30-reference/domain-catalog/README.md)
