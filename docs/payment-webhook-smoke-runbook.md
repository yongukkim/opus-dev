# OPUS Payment Webhook Smoke Runbook

목표: 주문 생성 -> mock webhook 수신 -> 주문/결제 상태 전이까지 단일 스크립트로 점검한다.

## 사전 조건

- 웹 앱이 실행 중이어야 한다 (`BASE_URL` 접근 가능)
- 로그인 세션 쿠키를 확보해야 한다 (`OPUS_SESSION_COOKIE`)
  - 예: 브라우저 DevTools에서 Auth.js 세션 쿠키 값을 가져와 `name=value` 형태로 지정
- 웹훅 비밀키가 서버 환경과 동일해야 한다 (`OPUS_MOCK_WEBHOOK_SECRET`)

## 실행

```bash
BASE_URL="https://app.opus-store.com" \
OPUS_SESSION_COOKIE="authjs.session-token=..." \
OPUS_MOCK_WEBHOOK_SECRET="..." \
bash scripts/ops-payment-webhook-smoke.sh
```

## 기대 결과

- 주문 생성 응답에 `order.id`, `payment.id` 존재
- webhook 호출 응답 `ok: true`
- 최종 조회에서
  - `order.status = PAID`
  - `payments[0].status = SUCCEEDED`

## 실패 시 점검

- `invalid_signature`: `OPUS_MOCK_WEBHOOK_SECRET` 불일치
- `unauthorized`:
  - 세션 쿠키 만료/권한 불일치
  - collector 계정으로 주문 생성 API 호출 필요
- `not_found`:
  - `paymentId`, `orderId` 매핑 오류
- 상태 전이 실패:
  - DB migration 미적용 (`orders`, `payments`, `payment_events`)
  - webhook payload `type` 값 불일치
