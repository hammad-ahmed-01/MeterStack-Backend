# MeterStack

MeterStack is an API platform. The long-term product covers metering, monetization, billing, webhooks, and observability. This repo is the v0.1 backend: enough to sign in, belong to an organization, define API products, issue keys, and subscribe.

The frontend is a separate Next.js app. It authenticates with Supabase and talks to this API. Business data is not meant to be read from Postgres by the client.

Stack: Node, Express, TypeScript, Supabase (Auth + Postgres), Stripe, Zod, Pino.

## How it works

A user signs in through Supabase. Every protected request carries that access token. The API verifies it, then loads the user and their organization from the database. Body fields like `user_id`, `organization_id`, or `role` are not trusted.

Each user has a `profiles` row, separate from `auth.users`. Signup creates it via a trigger; `GET /api/v1/me` will create it if it is missing.

An organization is the tenant. Creating one makes the caller the owner and starts them on the Free plan. If Stripe is configured it also opens a Stripe customer. The schema already allows several memberships per user. For now the current org is the earliest one, unless the request sends `X-Organization-Id` for an org the user actually belongs to. Roles are just `owner` and `member`.

API products belong to an organization. Listing, fetching, updating, or deleting always filters by that org, so guessing another tenant's id returns 404. Delete archives the product instead of removing the row.

API keys look like `ms_test_…` or `ms_live_…`. The full secret is returned once, at creation. After that the API only stores a prefix and a SHA-256 hash. Revoking marks the key revoked; the row stays. There is no gateway yet, so these keys are not used to authenticate inbound API traffic.

Billing is local-first. Every org gets a `subscriptions` row on the Free plan without Stripe. Checkout, the customer portal, and webhooks need `STRIPE_SECRET_KEY` (plus a webhook secret / Pro price id where relevant) and return `STRIPE_NOT_CONFIGURED` if those are missing. Duplicate Stripe event ids are ignored.

## API

All routes sit under `/api/v1`.

| | | |
| --- | --- | --- |
| `GET /health` | public | `{ status, service, version }` |
| `GET /me` | user | `{ id, email, fullName }` |
| `POST /organizations` | user | create org, owner, Free plan |
| `GET /organizations/current` | user | current org |
| `PATCH /organizations/current` | owner | rename |
| `GET /products` | member | optional `?status=active\|archived` |
| `POST /products` | member | |
| `GET /products/:id` | member | 404 across orgs |
| `PATCH /products/:id` | member | |
| `DELETE /products/:id` | member | archive |
| `GET /api-keys` | member | never returns the secret or hash |
| `POST /api-keys` | member | secret once |
| `DELETE /api-keys/:id` | member | revoke |
| `GET /billing/subscription` | member | |
| `POST /billing/checkout-session` | member | Pro |
| `POST /billing/customer-portal` | member | |
| `POST /webhooks/stripe` | Stripe signature | |

Errors look like `{ error: { code, message } }`. Validation failures add `details`.

## Data

SQL is in `supabase/migrations/`.

- `profiles` — product profile, keyed to `auth.users`
- `organizations` — tenant, unique slug, optional Stripe customer
- `organization_members` — `owner` / `member`
- `api_products` — `active` / `archived`
- `api_keys` — prefix + hash
- `subscriptions` — `free` / `pro`, one per org
- `stripe_events` — webhook idempotency

The API uses the Supabase service role, which bypasses RLS. Access control lives in the backend. RLS is still on so the public anon key cannot read org, product, key, or billing tables from the frontend.

## Config

Required env: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`. Stripe vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`) are optional. Missing required values fail startup. Service role and Stripe secret stay on this server.

`npm run dev` serves on port 4000. Also `build`, `start`, `typecheck`, `lint`, `test`. Tests cover key generation/hashing, auth middleware, org membership checks, and product isolation.

v0.1 does not meter requests, run a gateway, or do usage-based billing.
