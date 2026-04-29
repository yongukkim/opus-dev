#!/usr/bin/env bash
# Smoke: create mock order -> post mock webhook -> verify order/payment status transition.
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
SESSION_COOKIE="${OPUS_SESSION_COOKIE:-}"
WEBHOOK_SECRET="${OPUS_MOCK_WEBHOOK_SECRET:-}"

if [[ -z "$SESSION_COOKIE" ]]; then
  echo "[ops-payment-smoke] ERROR: OPUS_SESSION_COOKIE is required" >&2
  exit 1
fi
if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "[ops-payment-smoke] ERROR: OPUS_MOCK_WEBHOOK_SECRET is required" >&2
  exit 1
fi

RID="$(date +%s)-$RANDOM"
IDEMP="ops-smoke-$RID"
TITLE="OPUS webhook smoke $RID"
AMOUNT=1200

echo "[ops-payment-smoke] create order"
create_json="$(
  curl -sS --fail-with-body \
    -X POST "${BASE_URL}/api/payments/orders" \
    -H "Content-Type: application/json" \
    -H "x-idempotency-key: ${IDEMP}" \
    -H "Cookie: ${SESSION_COOKIE}" \
    --data "{\"title\":\"${TITLE}\",\"amountJpy\":${AMOUNT}}"
)"
echo "$create_json"

order_id="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("order") or {}).get("id",""))' <<<"$create_json")"
payment_id="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("payment") or {}).get("id",""))' <<<"$create_json")"
if [[ -z "$order_id" || -z "$payment_id" ]]; then
  echo "[ops-payment-smoke] ERROR: failed to parse order/payment id" >&2
  exit 1
fi
echo "[ops-payment-smoke] order_id=${order_id} payment_id=${payment_id}"

event_id="evt-${RID}"
payload="$(printf '{"eventId":"%s","paymentId":"%s","orderId":"%s","type":"payment_intent.succeeded","amountJpy":%d}' "$event_id" "$payment_id" "$order_id" "$AMOUNT")"
sig="$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | awk '{print $2}')"

echo "[ops-payment-smoke] post webhook"
webhook_json="$(
  curl -sS --fail-with-body \
    -X POST "${BASE_URL}/api/payments/webhook/mock" \
    -H "Content-Type: application/json" \
    -H "x-opus-mock-signature: ${sig}" \
    --data "$payload"
)"
echo "$webhook_json"

echo "[ops-payment-smoke] fetch order status"
status_json="$(
  curl -sS --fail-with-body \
    "${BASE_URL}/api/payments/orders/${order_id}" \
    -H "Cookie: ${SESSION_COOKIE}"
)"
echo "$status_json"

order_status="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("order") or {}).get("status",""))' <<<"$status_json")"
payment_status="$(python3 -c 'import json,sys; d=json.load(sys.stdin); p=(d.get("order") or {}).get("payments") or []; print((p[0] or {}).get("status","") if p else "")' <<<"$status_json")"
if [[ "$order_status" != "PAID" || "$payment_status" != "SUCCEEDED" ]]; then
  echo "[ops-payment-smoke] ERROR: unexpected status order=${order_status} payment=${payment_status}" >&2
  exit 1
fi

echo "[ops-payment-smoke] OK order=${order_status} payment=${payment_status}"
