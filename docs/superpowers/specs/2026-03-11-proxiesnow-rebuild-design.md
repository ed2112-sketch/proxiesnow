# ProxiesNow Site Rebuild — Design Spec

## Overview

Rebuild proxiesnow.com as a Next.js 14+ application deployed on Railway. The site serves two purposes: public marketing pages for SEO and lead generation, and an authenticated customer dashboard for proxy management. User accounts and billing are managed by WHMCS on a separate Digital Ocean droplet. Proxy authentication data lives in a PostgreSQL database on Railway, shared with Squid proxy servers.

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
| Framework    | Next.js 14+ (App Router)         |
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
| `/blog`              | Blog listing and individual posts                |
| `/contact`           | Contact form                                     |
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
├── password        VARCHAR — auth password (hashed)
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

Note: The `proxies` table must remain readable by Squid servers for auth verification. The migration from MySQL to PostgreSQL will require updating Squid's auth configuration to point to the new database.

## WHMCS Integration

### Authentication Flow

1. User submits login form at `/login`
2. Next.js API route calls WHMCS `ValidateLogin` with email/password
3. On success, calls `GetClientsDetails` to fetch client profile
4. Creates an iron-session with `whmcs_client_id`, email, and name
5. Dashboard pages check session; redirect to `/login` if missing

### Service Data

- `GetClientsProducts` — fetches active services for the logged-in client
- Product pages link to WHMCS order forms for purchasing (external redirect)

### Provisioning Webhook

1. Customer completes purchase in WHMCS
2. WHMCS `AfterModuleCreate` hook fires
3. Hook sends POST to `https://proxiesnow.com/api/webhooks/whmcs/provision`
4. Payload includes: `client_id`, `service_id`, `product_type`, `quantity`
5. Next.js API route validates webhook authenticity (shared secret)
6. Creates proxy entries in PostgreSQL and links them via `user_proxies`

## Brand & Design

- Fresh modern redesign with professional, clean aesthetic
- Brand colors approximated from current site: dark navy blues, accent greens
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

## Out of Scope

- WHMCS setup/configuration (assumed pre-existing on Digital Ocean)
- Squid server configuration (existing, will need DB connection update)
- Email/notification system
- MySQL-to-PostgreSQL data migration (will need a separate migration plan for existing proxy auth data)
