# Khalti Node Express Starter

A modular Node.js + Express starter for **real Khalti ePayment integration**.

This repo is intentionally narrow in scope. It focuses only on the Khalti payment lifecycle:

- initiate payment from your backend
- redirect the user to Khalti Web Checkout
- receive the callback on your backend
- confirm the final status using Khalti lookup
- persist transactions and payment events for debugging and reference

There is no wallet system, no fake checkout, and no database dependency. The goal is to give newcomers a clean, practical reference they can lift into their own project.

## What this starter includes

- Express app with a modular folder structure
- Real Khalti sandbox and production configuration
- Server-side payment initiation
- Callback handler for Khalti redirect flow
- Lookup-based settlement so callback query params are not treated as final truth
- Local JSON persistence for `transactions` and `paymentEvents`
- Manual lookup endpoint for re-syncing a transaction
- `.env.example` with the required setup variables
- README guidance for local development and public callback URLs

## Project structure

```text
khalti-node-express-starter/
├── data/
│   └── runtime.json
├── scripts/
│   └── reset-data.js
├── src/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   │   └── khalti/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Data model

This starter uses a file-backed JSON store so the repo runs without Postgres or Docker.

### Transactions

Each transaction stores:

- `id`
- `provider`
- `environment`
- `purchaseOrderId`
- `purchaseOrderName`
- `amountNpr`
- `amountPaisa`
- `status`
- `pidx`
- `paymentUrl`
- `returnUrl`
- `websiteUrl`
- `expiresAt`
- `expiresIn`
- `customerInfo`
- `metadata`
- `gateway.rawInitiateResponse`
- `gateway.rawCallbackQuery`
- `gateway.rawLookupResponse`
- timestamps

### Payment events

Each event stores:

- `id`
- `transactionId`
- `type`
- `source`
- `payload`
- `createdAt`

This mirrors the useful parts of a production payment design:

- one main payment transaction record
- provider identifiers like `pidx`
- an append-only event trail for debugging and audits

## Payment flow

### 1. Initiate payment

Endpoint:

```text
POST /api/v1/payments/initiate
```

Example request body:

```json
{
  "amount": 1000,
  "purchaseOrderId": "ORDER-1001",
  "purchaseOrderName": "Starter Plan",
  "customerInfo": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9800000001"
  },
  "metadata": {
    "source": "docs-example"
  }
}
```

Response includes:

- internal transaction record
- `pidx`
- `paymentUrl`
- expiry data returned by Khalti

Starter note:

- This starter accepts amounts from `1 NPR`.
- Khalti's current Web Checkout docs show validation errors for amounts below Rs. 10 on real requests, so sandbox or production may still reject very small amounts even though the app accepts them.

### 2. Redirect the user to Khalti

Open or redirect to the returned `paymentUrl`.

Example response shape from Khalti:

```json
{
  "pidx": "dKo8K8fKm7VGDZwp46u7Ca",
  "payment_url": "https://test-pay.khalti.com/?pidx=dKo8K8fKm7VGDZwp46u7Ca",
  "expires_at": "2026-02-28T16:20:58.634899+05:45",
  "expires_in": 1800
}
```

### 3. Receive callback on your backend

Khalti redirects to:

```text
GET /api/v1/payments/callback/khalti
```

The app does not trust the callback query alone as final confirmation. It:

- records the callback as a payment event
- stores the raw callback query on the transaction
- performs Khalti lookup using `pidx`
- updates the transaction using the lookup response as the authoritative source
- renders an HTML status page for quick confirmation

### 4. Re-sync manually if needed

You can trigger lookup again for a stored transaction:

```text
POST /api/v1/payments/:transactionId/lookup
```

This is useful during debugging, retries, or when you want to verify a status after the redirect flow.

## API endpoints

- `GET /`
- `GET /api/v1/health`
- `POST /api/v1/payments/initiate`
- `GET /api/v1/payments`
- `GET /api/v1/payments/:transactionId`
- `POST /api/v1/payments/:transactionId/lookup`
- `GET /api/v1/payments/events`
- `GET /api/v1/payments/callback/khalti`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your env file

```bash
cp .env.example .env
```

### 3. Set Khalti sandbox credentials

Use your Khalti test credentials in `.env`:

```env
KHALTI_ENV=sandbox
KHALTI_SECRET_KEY=your_test_secret_key
WEBSITE_URL=http://localhost:5173
PUBLIC_BASE_URL=https://your-public-url
CALLBACK_PATH=/api/v1/payments/callback/khalti
```

If you do not set `KHALTI_BASE_URL`, the starter uses:

```text
https://dev.khalti.com/api/v2
```

### 4. Start the server

```bash
npm run dev
```

### 5. Initiate a payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "purchaseOrderId": "ORDER-1001",
    "purchaseOrderName": "Demo Product"
  }'
```

The response will include a real Khalti `paymentUrl`. Open that URL in the browser and complete the sandbox checkout.

## Public callback URL options

Khalti must be able to redirect back to a reachable callback URL. The starter builds it as:

```text
PUBLIC_BASE_URL + CALLBACK_PATH
```

Two practical options:

### Option 1: ngrok

```bash
ngrok http 3000
```

Then copy the HTTPS URL into `.env`:

```env
PUBLIC_BASE_URL=https://your-subdomain.ngrok-free.app
```

### Option 2: Cloudflare Quick Tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

Then copy the generated URL into `.env`:

```env
PUBLIC_BASE_URL=https://random-subdomain.trycloudflare.com
```

Cloudflare Quick Tunnel is a good alternative when you want a fast public callback URL without setting up extra app-side tooling.

## Sandbox vs production

### Sandbox

```env
KHALTI_ENV=sandbox
```

Default base URL:

```text
https://dev.khalti.com/api/v2
```

### Production

```env
KHALTI_ENV=production
KHALTI_SECRET_KEY=your_live_secret_key
PUBLIC_BASE_URL=https://api.yourdomain.com
WEBSITE_URL=https://yourdomain.com
```

Default base URL:

```text
https://khalti.com/api/v2
```

## Security and design notes

- Payment initiation is server-side only.
- Transaction confirmation is based on Khalti lookup, not the redirect query alone.
- Duplicate `purchaseOrderId` values are rejected to keep the reference deterministic.
- Repeated callbacks do not re-settle an already completed transaction.
- The JSON store is for learning and starter use only. Replace it with a real database in production.

## How to use this in your own project

If you already have an app, the most reusable parts are:

- `src/services/khalti/khaltiClient.js`
- `src/services/paymentService.js`
- the callback flow with lookup confirmation
- the transaction + payment event persistence shape

If you want to productionize it, the next changes are usually:

1. Replace the JSON file store with Postgres, MySQL, MongoDB, Prisma, or Drizzle.
2. Add request validation with a schema library such as Zod or Joi.
3. Add tests for initiate, callback, lookup failure, and retry paths.
4. Add authentication and associate transactions with your own users or orders.
5. Add structured logging and reconciliation tooling.

## Reset local data

```bash
npm run reset:data
```

## References

- Khalti ePayment docs: https://docs.khalti.com/khalti-epayment/
- ngrok HTTP tunnels: https://ngrok.com/docs/http
- Cloudflare Quick Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
