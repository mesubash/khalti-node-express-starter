# Khalti Node Express Starter

A simple, modular, open source starter for **Khalti ePayment** using **Node.js + Express**.

This project is intentionally focused on one thing only:

- initiating Khalti payments
- handling the callback flow
- tracking transaction state
- storing payment events for debugging and learning

It does **not** add wallet logic, user auth, or a real database. Those can be layered in later. For newcomers, this keeps the reference small and easier to reuse.

## Why this starter exists

The goal is to provide a clean starter that developers can:

- run locally in a few minutes
- understand without reading a large codebase
- use as a template in real applications
- compare with a Spring-based Khalti implementation

## Features

- Modular Express project structure
- Khalti-only payment flow
- Two operating modes:
  - `mock`: fully local demo mode with a fake checkout page
  - `live`: real Khalti sandbox/live API integration
- File-backed JSON data store for transactions and payment events
- Callback handling with lookup-based confirmation
- Optional custom HMAC signature enforcement if you proxy or sign callback traffic in your own stack
- Lookup verification after live callback reception
- HTML callback page for quick visual confirmation
- `.env.example` for fast setup

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

This starter uses a local JSON file instead of Postgres so it runs with zero database setup.

### Transactions

Each transaction stores:

- internal `id`
- `purchaseOrderId`
- `purchaseOrderName`
- `amountNpr`
- `amountPaisa`
- `status`
- `pidx`
- `paymentUrl`
- `returnUrl`
- `websiteUrl`
- callback and lookup payload snapshots
- timestamps

### Payment events

Each payment event stores:

- internal `id`
- `transactionId`
- event `type`
- event `source`
- raw `payload`
- `createdAt`

This mirrors the main ideas from your Spring implementation:

- a transaction record
- a provider transaction identifier (`pidx`)
- payment lifecycle updates
- an event trail for audit/debugging

## API flow

### 1. Initiate payment

`POST /api/v1/payments/initiate`

Example body:

```json
{
  "amount": 1000,
  "purchaseOrderId": "ORDER-1001",
  "purchaseOrderName": "Starter Plan",
  "customerInfo": {
    "name": "Test User",
    "email": "test@example.com"
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
- expiry data

### 2. Open Khalti payment page

Use the returned `paymentUrl`.

- In `live` mode, this is the real Khalti payment URL.
- In `mock` mode, this is a local mock checkout screen that simulates Khalti.

### 3. Receive callback

Khalti redirects to:

`GET /api/v1/payments/callback/khalti`

The starter:

- records the callback as a payment event
- updates transaction status
- runs lookup verification in `live` mode
- shows a basic HTML result page

Important:

- For real Khalti confirmation, rely on the lookup API after the redirect callback.
- The optional `STRICT_CALLBACK_SIGNATURE` setting in this starter is an app-level hardening option, not a replacement for Khalti lookup confirmation.

## Endpoints

- `GET /`
- `GET /api/v1/health`
- `POST /api/v1/payments/initiate`
- `GET /api/v1/payments`
- `GET /api/v1/payments/:transactionId`
- `GET /api/v1/payments/events`
- `GET /api/v1/payments/callback/khalti`
- `GET /api/v1/payments/mock/checkout/:pidx`
- `POST /api/v1/payments/mock/checkout/:pidx/complete`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

### 3. Start in mock mode

Keep:

```env
KHALTI_MODE=mock
PUBLIC_BASE_URL=http://localhost:3000
```

Then run:

```bash
npm run dev
```

### 4. Test locally

Initiate a payment:

```bash
curl -X POST http://localhost:3000/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "purchaseOrderId": "ORDER-1001",
    "purchaseOrderName": "Demo Product"
  }'
```

Open the returned `paymentUrl` in the browser and simulate success or cancellation.

## Live Khalti mode

Switch:

```env
KHALTI_MODE=live
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_SECRET_KEY=your_secret_key
WEBSITE_URL=http://localhost:5173
```

You also need a **public callback URL** because Khalti must redirect back to a reachable URL.

## Public callback URL options

This starter supports both approaches through the same env variable:

- `PUBLIC_BASE_URL=https://your-public-url`
- `CALLBACK_PATH=/api/v1/payments/callback/khalti`

The final callback URL becomes:

`PUBLIC_BASE_URL + CALLBACK_PATH`

### Option 1: ngrok

Set:

```bash
ngrok http 3000
```

Then place the generated HTTPS URL into `.env`:

```env
PUBLIC_BASE_URL=https://your-subdomain.ngrok-free.app
```

### Option 2: Cloudflare Quick Tunnel

Set:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then place the generated HTTPS URL into `.env`:

```env
PUBLIC_BASE_URL=https://random-subdomain.trycloudflare.com
```

Cloudflare Quick Tunnel is a strong alternative when you want a simple public URL without configuring a separate app inside this project.

## Security notes

- Payment initiation is always server-side.
- In `live` mode, callback verification should be backed by Khalti lookup.
- `STRICT_CALLBACK_SIGNATURE=true` can be enabled if you want to reject unsigned or invalid callback requests.
- The starter prevents duplicate `purchaseOrderId` values to keep the example deterministic.
- Completed transactions are not re-settled on repeated callbacks.

## How to use this starter in a real project

### If you are building a new app

Start with this starter and then replace the file store with:

- PostgreSQL
- MySQL
- MongoDB
- Prisma
- Drizzle

Then extend the transaction schema with:

- user ID
- order ID
- reconciliation fields
- refund fields
- internal audit logs

### If you already have an application

Reuse these pieces:

- `KhaltiClient`
- `PaymentService`
- callback signature utility
- lookup verification step
- event trail design

## Suggested production improvements

- move JSON storage to a real database
- add request validation with a schema library
- add tests for callback and lookup paths
- add idempotency keys
- add structured logging
- add webhook replay protection

## Reset local data

```bash
npm run reset:data
```

## Sources

Khalti callback and lookup behavior in this starter follows the official Khalti ePayment docs:

- https://docs.khalti.com/khalti-epayment/

For public tunnel options referenced in this README:

- https://ngrok.com/docs/http
- https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
