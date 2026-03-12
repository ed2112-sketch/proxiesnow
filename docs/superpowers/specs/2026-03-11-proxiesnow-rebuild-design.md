# ProxiesNow Site Rebuild — Design Spec

## Overview

Rebuild proxiesnow.com as a Next.js 15 application deployed on Railway. The site serves two purposes: public marketing pages for SEO and lead generation, and an authenticated customer dashboard for proxy management. User accounts and billing are managed by WHMCS on a separate Digital Ocean droplet. Proxy authentication data lives in a PostgreSQL database on Railway, shared with Squid proxy servers.

## Architecture

### System Diagram

```
User Browser
    ↕
Next.js App (Railway)
    ├── Server Components → Marketing pages (SSR)
    ├── Client Components → Dashboard (authenticated)
    ├── API Routes → WHMCS API (Digital Ocean) — auth, billing, services
    └── API Routes → PostgreSQL (Railway) — proxy credentials, status, usage

WHMCS (Digital Ocean)
    └── Webhook on new order → Next.js API route → provisions proxy entries in PostgreSQL

Squid Proxy Servers
    └── Read PostgreSQL directly for proxy auth verification
```

### Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Framework    | Next.js 15 (App Router)          |
| Styling      | Tailwind CSS                      |
| ORM          | Prisma                           |
| Database     | PostgreSQL (Railway)             |
| Auth         | iron-session, validated via WHMCS |
| Deployment   | Railway (nixpacks)               |

## Pages & Routing

### Marketing Pages (Server-Rendered, Public)

| Route                | Description                                      |
| -------------------- | ------------------------------------------------ |
| `/`                  | Home/landing page                                |
| `/private-proxies`   | Product page with pricing, links to WHMCS order  |
| `/shared-proxies`    | Product page with pricing, links to WHMCS order  |
| `/socks5-proxies`    | Product page with pricing, links to WHMCS order  |
| `/residential-proxies` | Product page with pricing, links to WHMCS order |
| `/faq`               | FAQ page                                         |
| `/blog`              | Blog listing and individual posts (MDX files in repo) |
| `/contact`           | Contact form (submissions sent via third-party email service e.g. Resend) |
| `/privacy-policy`    | Privacy policy                                   |
| `/tos`               | Terms of service                                 |

### Dashboard Pages (Authenticated, Client-Rendered)

| Route                    | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `/login`                 | Login form, authenticates against WHMCS ValidateLogin    |
| `/logout`                | Clears session, redirects to home                        |
| `/dashboard`             | Overview of active services from WHMCS                   |
| `/dashboard/proxies`     | Proxy list: IP, port, credentials, status, usage         |
| `/dashboard/proxies/[id]` | Proxy detail with self-service actions                  |

### Dashboard Self-Service Actions

- View proxy details (IP, port, username, password, protocol, status)
- Regenerate proxy credentials (new username/password)
- Request IP replacement
- Toggle proxy active/inactive

## Data Model

### PostgreSQL Schema (Proxy Auth Database)

```
proxies
├── id              UUID, primary key
├── server_host     VARCHAR — the Squid server hostname
├── ip              VARCHAR — proxy IP address
├── port            INTEGER — proxy port
├── username        VARCHAR — auth username
├── password        VARCHAR — auth password (stored as plaintext for Squid basic auth compatibility)
├── protocol        ENUM('HTTP', 'SOCKS5')
├── status          ENUM('active', 'inactive')
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

user_proxies
├── id              UUID, primary key
├── whmcs_client_id INTEGER — references WHMCS client
├── whmcs_service_id INTEGER — references WHMCS service/order
├── proxy_id        UUID, foreign key → proxies.id
└── assigned_at     TIMESTAMP

usage_logs
├── id              UUID, primary key
├── proxy_id        UUID, foreign key → proxies.id
├── bandwidth_used  BIGINT — bytes
└── recorded_at     TIMESTAMP
```

Note: The `proxies` table must remain readable by Squid servers for auth verification. The migration from MySQL to PostgreSQL will require updating Squid's auth configuration to point to the new database. Proxy passwords are stored as plaintext because Squid's basic auth helper needs to verify credentials directly — the database connection is not publicly exposed, so this is acceptable.

### Proxy Pool & Allocation

Proxies are pre-loaded into the `proxies` table as an available pool. Each proxy row represents a real IP/port on a Squid server. When a provisioning webhook fires:

1. The API selects `quantity` unassigned proxies (not linked in `user_proxies`) matching the `product_type` protocol
2. Creates `user_proxies` rows linking the selected proxies to the client/service
3. Sets proxy status to `active`

**IP Replacement:** When a user requests IP replacement, the system unlinks the current proxy (removes `user_proxies` row, sets proxy status to `inactive`), then assigns a new unassigned proxy from the pool. If no proxies are available in the pool, the request is queued and surfaced to the admin.

**Toggle active/inactive:** Changing proxy status takes effect immediately since Squid reads the `proxies` table directly — an `inactive` proxy will be rejected at auth time.

## WHMCS Integration

### Authentication Flow

1. User submits login form at `/login`
2. Next.js API route calls WHMCS `ValidateLogin` with email/password
3. On success, calls `GetClientsDetails` to fetch client profile
4. Creates an iron-session with `whmcs_client_id`, email, and name
5. Dashboard pages check session; redirect to `/login` if missing
6. Sessions expire after 24 hours; on expiry, user must re-authenticate against WHMCS

### Service Data

- `GetClientsProducts` — fetches active services for the logged-in client
- Product pages link to WHMCS order forms for purchasing (external redirect)

### Provisioning Webhook

1. Customer completes purchase in WHMCS
2. WHMCS `AfterModuleCreate` hook fires
3. Hook sends POST to `https://proxiesnow.com/api/webhooks/whmcs/provision`
4. Payload includes: `client_id`, `service_id`, `product_type`, `quantity`
5. Next.js API route validates webhook authenticity (shared secret)
6. Selects unassigned proxies from the pool matching the product type and assigns them via `user_proxies`
7. Uses `whmcs_service_id` as an idempotency key — duplicate webhooks for the same service are ignored

## Brand & Design

- Fresh modern redesign with professional, clean aesthetic
- Brand colors approximated from current site: primary navy `#1a2b4a`, accent green `#2ecc71`, light gray `#f5f7fa`
- Tailwind CSS for consistent design system
- Fully responsive / mobile-friendly
- No emojis; professional tone throughout

## Deployment

### Railway Setup

- **Web Service:** Next.js app, auto-detected by nixpacks
- **Database:** Railway PostgreSQL plugin
- **Environment Variables:**
  - `DATABASE_URL` — PostgreSQL connection string
  - `WHMCS_API_URL` — WHMCS API endpoint
  - `WHMCS_API_IDENTIFIER` — WHMCS API credential
  - `WHMCS_API_SECRET` — WHMCS API credential
  - `WHMCS_WEBHOOK_SECRET` — shared secret for webhook validation
  - `SESSION_SECRET` — iron-session encryption key

### Domain

- `proxiesnow.com` pointed to Railway via CNAME or A record

### Usage Tracking

The `usage_logs` table is written to by Squid servers (via external log processing). The Next.js dashboard reads this data for display only — it does not write usage logs.

### Error Handling

- Custom 404 and 500 error pages matching site design
- WHMCS API failures in the dashboard show user-friendly error messages with retry option
- Login failures show generic "invalid credentials" (no information leakage)

## Out of Scope

- WHMCS setup/configuration (assumed pre-existing on Digital Ocean)
- Squid server configuration (existing, will need DB connection update)
- Email/notification system (beyond contact form)
- MySQL-to-PostgreSQL data migration (will need a separate migration plan for existing proxy auth data)
