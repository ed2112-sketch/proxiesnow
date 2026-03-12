# ProxiesNow Site Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild proxiesnow.com as a Next.js 15 app on Railway with WHMCS auth integration and PostgreSQL proxy management.

**Architecture:** Next.js 15 App Router with server-rendered marketing pages and client-rendered authenticated dashboard. WHMCS on Digital Ocean handles billing/accounts. PostgreSQL on Railway stores proxy auth data shared with Squid servers.

**Tech Stack:** Next.js 15, Tailwind CSS, Prisma, PostgreSQL, iron-session, Resend (contact form)

---

## Chunk 1: Project Scaffolding, Database, and Auth

### Task 1: Initialize Next.js 15 Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (placeholder)
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Next.js 15 project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Create .env.example with all required env vars**

Create `.env.example`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/proxiesnow
WHMCS_API_URL=https://billing.proxiesnow.com/includes/api.php
WHMCS_API_IDENTIFIER=your_api_identifier
WHMCS_API_SECRET=your_api_secret
WHMCS_WEBHOOK_SECRET=your_webhook_secret
SESSION_SECRET=a_random_32_char_string_here_min
RESEND_API_KEY=re_your_api_key
NEXT_PUBLIC_WHMCS_URL=https://billing.proxiesnow.com
```

- [ ] **Step 3: Update Tailwind config with brand colors**

In `tailwind.config.ts`, extend the theme:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1a2b4a",
          50: "#f0f3f8",
          100: "#d9e0ed",
          200: "#b3c1db",
          300: "#8da2c9",
          400: "#6783b7",
          500: "#4164a5",
          600: "#345084",
          700: "#273c63",
          800: "#1a2b4a",
          900: "#0d1525",
        },
        accent: {
          DEFAULT: "#2ecc71",
          50: "#eafaf1",
          100: "#d5f5e3",
          200: "#abebc6",
          300: "#82e0aa",
          400: "#58d68d",
          500: "#2ecc71",
          600: "#25a35a",
          700: "#1c7a44",
          800: "#12522d",
          900: "#092917",
        },
        gray: {
          50: "#f5f7fa",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on localhost:3000

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with Tailwind and brand colors"
```

---

### Task 2: Set Up Prisma and Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (add prisma deps)

- [ ] **Step 1: Install Prisma**

Run:
```bash
npm install prisma --save-dev
npm install @prisma/client
```

- [ ] **Step 2: Initialize Prisma**

Run:
```bash
npx prisma init
```

- [ ] **Step 3: Write the schema**

Replace `prisma/schema.prisma` with:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Protocol {
  HTTP
  SOCKS5
}

enum ProxyStatus {
  active
  inactive
}

model Proxy {
  id         String      @id @default(uuid()) @db.Uuid
  serverHost String      @map("server_host")
  ip         String
  port       Int
  username   String
  password   String
  protocol   Protocol
  status     ProxyStatus @default(inactive)
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  userProxies UserProxy[]
  usageLogs   UsageLog[]

  @@map("proxies")
}

model UserProxy {
  id             String   @id @default(uuid()) @db.Uuid
  whmcsClientId  Int      @map("whmcs_client_id")
  whmcsServiceId Int      @map("whmcs_service_id")
  proxyId        String   @map("proxy_id") @db.Uuid
  assignedAt     DateTime @default(now()) @map("assigned_at")

  proxy Proxy @relation(fields: [proxyId], references: [id])

  @@unique([whmcsServiceId, proxyId])
  @@map("user_proxies")
}

model UsageLog {
  id            String   @id @default(uuid()) @db.Uuid
  proxyId       String   @map("proxy_id") @db.Uuid
  bandwidthUsed BigInt   @map("bandwidth_used")
  recordedAt    DateTime @default(now()) @map("recorded_at")

  proxy Proxy @relation(fields: [proxyId], references: [id])

  @@map("usage_logs")
}
```

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Generate Prisma client and create initial migration**

Run:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Expected: Prisma Client generated successfully, migration created in `prisma/migrations/`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with proxies, user_proxies, and usage_logs"
```

---

### Task 3: WHMCS API Client

**Files:**
- Create: `src/lib/whmcs.ts`
- Create: `src/lib/whmcs.test.ts`

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install --save-dev vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 2: Write tests for WHMCS client**

Create `src/lib/whmcs.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { whmcsApi, validateLogin, getClientDetails, getClientProducts } from "./whmcs";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.stubEnv("WHMCS_API_URL", "https://billing.example.com/includes/api.php");
  vi.stubEnv("WHMCS_API_IDENTIFIER", "test-id");
  vi.stubEnv("WHMCS_API_SECRET", "test-secret");
  mockFetch.mockReset();
});

describe("whmcsApi", () => {
  it("sends correct params and returns parsed JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "success" }),
    });

    const result = await whmcsApi("TestAction", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://billing.example.com/includes/api.php");
    expect(options.method).toBe("POST");
    const body = new URLSearchParams(options.body);
    expect(body.get("action")).toBe("TestAction");
    expect(body.get("identifier")).toBe("test-id");
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("responsetype")).toBe("json");
    expect(body.get("foo")).toBe("bar");
    expect(result).toEqual({ result: "success" });
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Server Error" });
    await expect(whmcsApi("TestAction", {})).rejects.toThrow("WHMCS API error: 500");
  });
});

describe("validateLogin", () => {
  it("returns client id on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "success", userid: 42 }),
    });

    const result = await validateLogin("user@example.com", "password123");
    expect(result).toEqual({ success: true, userId: 42 });
  });

  it("returns failure on invalid credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "error", message: "Invalid Credentials" }),
    });

    const result = await validateLogin("user@example.com", "wrong");
    expect(result).toEqual({ success: false, userId: null });
  });
});

describe("getClientDetails", () => {
  it("returns client details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        client: { firstname: "John", lastname: "Doe", email: "john@example.com" },
      }),
    });

    const result = await getClientDetails(42);
    expect(result).toEqual({ firstname: "John", lastname: "Doe", email: "john@example.com" });
  });
});

describe("getClientProducts", () => {
  it("returns products array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        products: { product: [{ id: 1, name: "Private Proxies", status: "Active" }] },
      }),
    });

    const result = await getClientProducts(42);
    expect(result).toEqual([{ id: 1, name: "Private Proxies", status: "Active" }]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/whmcs.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement WHMCS client**

Create `src/lib/whmcs.ts`:
```typescript
export async function whmcsApi(
  action: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const url = process.env.WHMCS_API_URL!;
  const body = new URLSearchParams({
    action,
    identifier: process.env.WHMCS_API_IDENTIFIER!,
    secret: process.env.WHMCS_API_SECRET!,
    responsetype: "json",
    ...params,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`WHMCS API error: ${response.status}`);
  }

  return response.json();
}

export async function validateLogin(
  email: string,
  password: string
): Promise<{ success: boolean; userId: number | null }> {
  const data = await whmcsApi("ValidateLogin", {
    email,
    password2: password,
  });

  if (data.result === "success") {
    return { success: true, userId: data.userid as number };
  }
  return { success: false, userId: null };
}

export async function getClientDetails(
  clientId: number
): Promise<Record<string, unknown>> {
  const data = await whmcsApi("GetClientsDetails", {
    clientid: clientId.toString(),
  });
  return data.client as Record<string, unknown>;
}

export async function getClientProducts(
  clientId: number
): Promise<Record<string, unknown>[]> {
  const data = await whmcsApi("GetClientsProducts", {
    clientid: clientId.toString(),
  });
  const products = data.products as { product: Record<string, unknown>[] };
  return products.product ?? [];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/whmcs.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add WHMCS API client with tests"
```

---

### Task 4: Session Management (iron-session)

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/lib/session.test.ts`

- [ ] **Step 1: Install iron-session**

Run:
```bash
npm install iron-session
```

- [ ] **Step 2: Write session config and helpers**

Create `src/lib/session.ts`:
```typescript
import { SessionOptions } from "iron-session";

export interface SessionData {
  whmcsClientId: number;
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  whmcsClientId: 0,
  email: "",
  name: "",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "proxiesnow_session",
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add iron-session config with 24h TTL"
```

---

### Task 5: Auth API Routes (Login/Logout)

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: Create login API route**

Create `src/app/api/auth/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateLogin, getClientDetails } from "@/lib/whmcs";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const loginResult = await validateLogin(email, password);

  if (!loginResult.success || !loginResult.userId) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const clientDetails = await getClientDetails(loginResult.userId);

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  session.whmcsClientId = loginResult.userId;
  session.email = email;
  session.name = `${clientDetails.firstname} ${clientDetails.lastname}`;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({
    user: { email: session.email, name: session.name },
  });
}
```

- [ ] **Step 2: Create logout API route**

Create `src/app/api/auth/logout/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.destroy();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create me API route (session check)**

Create `src/app/api/auth/me/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      email: session.email,
      name: session.name,
      whmcsClientId: session.whmcsClientId,
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add auth API routes (login, logout, session check)"
```

---

### Task 6: Dashboard Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware for dashboard route protection**

Create `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add middleware to protect dashboard routes"
```

---

## Chunk 2: Proxy Management API

### Task 7: Proxy CRUD API Routes

**Files:**
- Create: `src/app/api/proxies/route.ts`
- Create: `src/app/api/proxies/[id]/route.ts`
- Create: `src/app/api/proxies/[id]/regenerate/route.ts`
- Create: `src/app/api/proxies/[id]/replace/route.ts`
- Create: `src/app/api/proxies/[id]/toggle/route.ts`
- Create: `src/lib/proxy-service.ts`
- Create: `src/lib/proxy-service.test.ts`

- [ ] **Step 1: Write tests for proxy service**

Create `src/lib/proxy-service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCredentials } from "./proxy-service";

describe("generateCredentials", () => {
  it("returns username and password strings", () => {
    const creds = generateCredentials();
    expect(creds.username).toBeDefined();
    expect(creds.password).toBeDefined();
    expect(creds.username.length).toBeGreaterThanOrEqual(8);
    expect(creds.password.length).toBeGreaterThanOrEqual(12);
  });

  it("generates unique credentials each call", () => {
    const a = generateCredentials();
    const b = generateCredentials();
    expect(a.username).not.toBe(b.username);
    expect(a.password).not.toBe(b.password);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/proxy-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement proxy service**

Create `src/lib/proxy-service.ts`:
```typescript
import { randomBytes } from "crypto";
import { prisma } from "./db";
import { Protocol } from "@prisma/client";

export function generateCredentials(): { username: string; password: string } {
  return {
    username: `pn_${randomBytes(6).toString("hex")}`,
    password: randomBytes(12).toString("hex"),
  };
}

export async function getClientProxies(whmcsClientId: number) {
  return prisma.userProxy.findMany({
    where: { whmcsClientId },
    include: {
      proxy: {
        include: {
          usageLogs: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}

export async function getProxyForClient(proxyId: string, whmcsClientId: number) {
  return prisma.userProxy.findFirst({
    where: { proxyId, whmcsClientId },
    include: {
      proxy: {
        include: {
          usageLogs: {
            orderBy: { recordedAt: "desc" },
            take: 30,
          },
        },
      },
    },
  });
}

export async function regenerateProxyCredentials(proxyId: string) {
  const creds = generateCredentials();
  return prisma.proxy.update({
    where: { id: proxyId },
    data: { username: creds.username, password: creds.password },
  });
}

export async function toggleProxyStatus(proxyId: string) {
  const proxy = await prisma.proxy.findUniqueOrThrow({ where: { id: proxyId } });
  const newStatus = proxy.status === "active" ? "inactive" : "active";
  return prisma.proxy.update({
    where: { id: proxyId },
    data: { status: newStatus },
  });
}

export async function replaceProxyIp(proxyId: string, whmcsClientId: number) {
  const userProxy = await prisma.userProxy.findFirstOrThrow({
    where: { proxyId, whmcsClientId },
    include: { proxy: true },
  });

  const replacement = await prisma.proxy.findFirst({
    where: {
      protocol: userProxy.proxy.protocol,
      status: "inactive",
      userProxies: { none: {} },
    },
  });

  if (!replacement) {
    throw new Error("No replacement proxies available in the pool");
  }

  await prisma.$transaction([
    prisma.userProxy.delete({ where: { id: userProxy.id } }),
    prisma.proxy.update({ where: { id: proxyId }, data: { status: "inactive" } }),
    prisma.userProxy.create({
      data: {
        whmcsClientId,
        whmcsServiceId: userProxy.whmcsServiceId,
        proxyId: replacement.id,
      },
    }),
    prisma.proxy.update({ where: { id: replacement.id }, data: { status: "active" } }),
  ]);

  return replacement;
}

export async function provisionProxies(
  clientId: number,
  serviceId: number,
  productType: string,
  quantity: number
) {
  // Idempotency: check if already provisioned for this service
  const existing = await prisma.userProxy.findFirst({
    where: { whmcsServiceId: serviceId },
  });
  if (existing) return { alreadyProvisioned: true };

  const protocol: Protocol = productType.toUpperCase().includes("SOCKS") ? "SOCKS5" : "HTTP";

  const available = await prisma.proxy.findMany({
    where: {
      protocol,
      status: "inactive",
      userProxies: { none: {} },
    },
    take: quantity,
  });

  if (available.length < quantity) {
    throw new Error(`Not enough proxies available. Need ${quantity}, found ${available.length}`);
  }

  await prisma.$transaction([
    ...available.map((p) =>
      prisma.userProxy.create({
        data: {
          whmcsClientId: clientId,
          whmcsServiceId: serviceId,
          proxyId: p.id,
        },
      })
    ),
    ...available.map((p) =>
      prisma.proxy.update({
        where: { id: p.id },
        data: { status: "active" },
      })
    ),
  ]);

  return { alreadyProvisioned: false, assigned: available.length };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/proxy-service.test.ts`
Expected: PASS

- [ ] **Step 5: Create proxy list API route**

Create `src/app/api/proxies/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getClientProxies } from "@/lib/proxy-service";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proxies = await getClientProxies(session.whmcsClientId);
  return NextResponse.json({ proxies });
}
```

- [ ] **Step 6: Create proxy detail + actions API routes**

Create `src/app/api/proxies/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getProxyForClient } from "@/lib/proxy-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const proxy = await getProxyForClient(id, session.whmcsClientId);

  if (!proxy) {
    return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
  }

  return NextResponse.json({ proxy });
}
```

Create `src/app/api/proxies/[id]/regenerate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getProxyForClient, regenerateProxyCredentials } from "@/lib/proxy-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getProxyForClient(id, session.whmcsClientId);
  if (!existing) {
    return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
  }

  const updated = await regenerateProxyCredentials(id);
  return NextResponse.json({ proxy: updated });
}
```

Create `src/app/api/proxies/[id]/replace/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { replaceProxyIp } from "@/lib/proxy-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const replacement = await replaceProxyIp(id, session.whmcsClientId);
    return NextResponse.json({ proxy: replacement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to replace proxy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

Create `src/app/api/proxies/[id]/toggle/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getProxyForClient, toggleProxyStatus } from "@/lib/proxy-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getProxyForClient(id, session.whmcsClientId);
  if (!existing) {
    return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
  }

  const updated = await toggleProxyStatus(id);
  return NextResponse.json({ proxy: updated });
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add proxy service and CRUD API routes"
```

---

### Task 8: WHMCS Provisioning Webhook

**Files:**
- Create: `src/app/api/webhooks/whmcs/provision/route.ts`

- [ ] **Step 1: Create webhook route**

Create `src/app/api/webhooks/whmcs/provision/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { provisionProxies } from "@/lib/proxy-service";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (secret !== process.env.WHMCS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { client_id, service_id, product_type, quantity } = body;

  if (!client_id || !service_id || !product_type || !quantity) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const result = await provisionProxies(
      Number(client_id),
      Number(service_id),
      product_type,
      Number(quantity)
    );

    if (result.alreadyProvisioned) {
      return NextResponse.json({ message: "Already provisioned" }, { status: 200 });
    }

    return NextResponse.json({ message: "Provisioned", assigned: result.assigned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add WHMCS provisioning webhook endpoint"
```

---

## Chunk 3: Shared UI Components and Layout

### Task 9: Shared Layout Components

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/nav-link.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/container.tsx`
- Modify: `src/app/layout.tsx` (root — html/body only)
- Create: `src/app/(marketing)/layout.tsx` (header/footer wrapper)

- [ ] **Step 1: Create Container component**

Create `src/components/ui/container.tsx`:
```tsx
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create Button component**

Create `src/components/ui/button.tsx`:
```tsx
import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary: "bg-accent text-white hover:bg-accent-600 shadow-sm",
  secondary: "bg-navy text-white hover:bg-navy-700 shadow-sm",
  outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create NavLink component**

Create `src/components/layout/nav-link.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-accent ${
        isActive ? "text-accent" : "text-navy-200"
      }`}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Create Header component**

Create `src/components/layout/header.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { NavLink } from "./nav-link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/private-proxies", label: "Private Proxies" },
  { href: "/shared-proxies", label: "Shared Proxies" },
  { href: "/socks5-proxies", label: "SOCKS5 Proxies" },
  { href: "/residential-proxies", label: "Residential Proxies" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-navy-800 sticky top-0 z-50">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            ProxiesNow
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            <Button href="/login" variant="primary" size="sm">
              Sign In
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="flex flex-col gap-4 pb-4 md:hidden">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            <Button href="/login" variant="primary" size="sm">
              Sign In
            </Button>
          </nav>
        )}
      </Container>
    </header>
  );
}
```

- [ ] **Step 5: Create Footer component**

Create `src/components/layout/footer.tsx`:
```tsx
import Link from "next/link";
import { Container } from "@/components/ui/container";

const footerLinks = [
  { href: "/private-proxies", label: "Private Proxies" },
  { href: "/shared-proxies", label: "Shared Proxies" },
  { href: "/socks5-proxies", label: "SOCKS5 Proxies" },
  { href: "/residential-proxies", label: "Residential Proxies" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/tos", label: "TOS" },
];

export function Footer() {
  return (
    <footer className="bg-navy-800 py-12">
      <Container>
        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-navy-200 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 text-center text-sm text-navy-400">
          Copyright &copy; 2010 - {new Date().getFullYear()} ProxiesNow. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 6: Update root layout (html/body only, no header/footer)**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProxiesNow — High Quality Private Proxies",
  description:
    "Buy private, shared, and SOCKS5 proxies with unlimited bandwidth and 24/7 support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-white`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6b: Create marketing route group layout**

Create `src/app/(marketing)/layout.tsx`:
```tsx
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
```

Move the placeholder `src/app/page.tsx` to `src/app/(marketing)/page.tsx`.

- [ ] **Step 7: Verify dev server renders layout**

Run: `npm run dev`
Visit: `http://localhost:3000`
Expected: Page renders with header nav, footer, and placeholder content

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add shared layout with header, footer, and UI components"
```

---

## Chunk 4: Marketing Pages

### Task 10: Home Page

**Files:**
- Modify: `src/app/(marketing)/page.tsx`
- Create: `src/components/home/hero.tsx`
- Create: `src/components/home/features.tsx`
- Create: `src/components/home/products.tsx`
- Create: `src/components/home/testimonials.tsx`
- Create: `src/components/home/cta.tsx`

- [ ] **Step 1: Create Hero section**

Create `src/components/home/hero.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-navy-800 to-navy py-24 text-white">
      <Container className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Private Proxies from ProxiesNow
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-200">
          We provide the best proxies at the lowest prices. Unlimited bandwidth
          and support. No more searching for public proxy lists that are
          outdated and slow.
        </p>
        <div className="mt-10">
          <Button href="/private-proxies" size="lg">
            Get Started Now
          </Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create Features section**

Create `src/components/home/features.tsx`:
```tsx
import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Unlimited Bandwidth",
    description: "Never worry about how much bandwidth you use.",
  },
  {
    title: "Fast Server Speeds",
    description: "All proxies hosted on at least 1Gbps connections.",
  },
  {
    title: "24/7 Support",
    description: "99.9% uptime. Need a question answered? Ask us anytime!",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          Why Choose ProxiesNow?
        </h2>
        <p className="mt-4 text-center text-gray-600">
          An ultra fast and super simple proxy service for all your needs.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm"
            >
              <h3 className="text-lg font-semibold text-navy">{feature.title}</h3>
              <p className="mt-3 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Create Products section**

Create `src/components/home/products.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const products = [
  {
    title: "Residential Proxies",
    description:
      "Residential proxies based in the USA. Hosted with many different ISPs around the country.",
    href: "/residential-proxies",
  },
  {
    title: "Private Proxies",
    description:
      "Private proxies are the ultimate in online security. Located in multiple cities in the U.S., available for your usage only.",
    href: "/private-proxies",
  },
  {
    title: "SOCKS5 Proxies",
    description:
      "SOCKS5 proxies are the ultimate in online security. We have locations around the U.S.A.",
    href: "/socks5-proxies",
  },
];

export function Products() {
  return (
    <section className="bg-gray-50 py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          Choose Your Server
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.title}
              className="flex flex-col rounded-xl bg-white p-8 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-navy">{product.title}</h3>
              <p className="mt-4 flex-1 text-gray-600">{product.description}</p>
              <div className="mt-6">
                <Button href={product.href} variant="secondary" size="sm">
                  Order Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Create Testimonials section**

Create `src/components/home/testimonials.tsx`:
```tsx
import { Container } from "@/components/ui/container";

const testimonials = [
  { name: "Zach F.", location: "Estonia", quote: "Great proxies and support! The best value. Thanks!" },
  { name: "David L.", location: "Barbados", quote: "Quality service and fast response time. Overall very good service. Thank you." },
  { name: "Tyler W.", location: "New Zealand", quote: "The best proxy service we have ever used!" },
  { name: "Samuel A.", location: "Canada", quote: "You can not beat these prices. The proxies are great." },
  { name: "Brandon L.", location: "USA", quote: "Our business has benefited greatly since we ordered our proxies from ProxiesNow.com." },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          What Our Clients Say
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-gray-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <p className="font-semibold text-navy">{t.name}</p>
                <p className="text-sm text-gray-500">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 5: Create CTA section**

Create `src/components/home/cta.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="bg-accent py-16">
      <Container className="text-center">
        <h2 className="text-3xl font-bold text-white">Order Today!</h2>
        <div className="mt-8">
          <Button href="/private-proxies" variant="secondary" size="lg">
            Get Started Now
          </Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 6: Assemble home page**

Replace `src/app/(marketing)/page.tsx`:
```tsx
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { Products } from "@/components/home/products";
import { Testimonials } from "@/components/home/testimonials";
import { CTA } from "@/components/home/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Products />
      <Testimonials />
      <CTA />
    </>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add home page with hero, features, products, testimonials, CTA"
```

---

### Task 11: Product Pages

**Files:**
- Create: `src/components/product/product-page.tsx`
- Create: `src/app/(marketing)/private-proxies/page.tsx`
- Create: `src/app/(marketing)/shared-proxies/page.tsx`
- Create: `src/app/(marketing)/socks5-proxies/page.tsx`
- Create: `src/app/(marketing)/residential-proxies/page.tsx`

- [ ] **Step 1: Create reusable ProductPage component**

Create `src/components/product/product-page.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

type PricingTier = {
  name: string;
  count: string;
  price: string;
  perProxy: string;
};

type ProductPageProps = {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  pricingTiers: PricingTier[];
  orderUrl: string;
};

export function ProductPage({
  title,
  subtitle,
  description,
  features,
  pricingTiers,
  orderUrl,
}: ProductPageProps) {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-4 text-lg text-navy-200">{subtitle}</p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-lg text-gray-600">{description}</p>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-gray-50 py-16">
        <Container>
          <h2 className="text-center text-3xl font-bold text-navy">Pricing</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col rounded-xl bg-white p-6 text-center shadow-sm"
              >
                <h3 className="text-lg font-semibold text-navy">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.count}</p>
                <p className="mt-4 text-3xl font-bold text-navy">{tier.price}</p>
                <p className="text-sm text-gray-500">/month</p>
                <p className="mt-2 text-sm text-accent-600">{tier.perProxy} per proxy</p>
                <div className="mt-6">
                  <Button href={orderUrl} size="sm">
                    Order Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Create Private Proxies page**

Create `src/app/(marketing)/private-proxies/page.tsx`:
```tsx
import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Private Proxies — ProxiesNow",
  description: "Buy private proxies with unlimited bandwidth. Located in multiple U.S. cities.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=1`
  : "#";

export default function PrivateProxiesPage() {
  return (
    <ProductPage
      title="Private Proxies"
      subtitle="Dedicated proxies for your exclusive use"
      description="Our private proxies are reliable, fast, and come with around the clock support. When you buy proxies from ProxiesNow you will receive a list of proxies that only you have access to."
      features={[
        "100% dedicated to you — no sharing",
        "Multiple U.S. city locations",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Username/password or IP authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "5 Proxies", price: "$10", perProxy: "$2.00" },
        { name: "Basic", count: "10 Proxies", price: "$17", perProxy: "$1.70" },
        { name: "Standard", count: "25 Proxies", price: "$38", perProxy: "$1.52" },
        { name: "Premium", count: "50 Proxies", price: "$65", perProxy: "$1.30" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
```

- [ ] **Step 3: Create Shared Proxies page**

Create `src/app/(marketing)/shared-proxies/page.tsx`:
```tsx
import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Shared Proxies — ProxiesNow",
  description: "Buy affordable shared proxies with unlimited bandwidth.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=2`
  : "#";

export default function SharedProxiesPage() {
  return (
    <ProductPage
      title="Shared Proxies"
      subtitle="Affordable proxies shared with a small group"
      description="Our shared proxies offer great performance at a lower cost. Each proxy is shared with a maximum of 3 users to maintain speed and reliability."
      features={[
        "Shared with maximum 3 users",
        "U.S. based locations",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Username/password authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "5 Proxies", price: "$5", perProxy: "$1.00" },
        { name: "Basic", count: "10 Proxies", price: "$9", perProxy: "$0.90" },
        { name: "Standard", count: "25 Proxies", price: "$19", perProxy: "$0.76" },
        { name: "Premium", count: "50 Proxies", price: "$35", perProxy: "$0.70" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
```

- [ ] **Step 4: Create SOCKS5 Proxies page**

Create `src/app/(marketing)/socks5-proxies/page.tsx`:
```tsx
import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "SOCKS5 Proxies — ProxiesNow",
  description: "Buy SOCKS5 proxies with unlimited bandwidth. U.S. locations.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=3`
  : "#";

export default function Socks5ProxiesPage() {
  return (
    <ProductPage
      title="SOCKS5 Proxies"
      subtitle="The ultimate in online security"
      description="SOCKS5 proxies provide a versatile, high-performance connection. Support for any protocol including HTTP, HTTPS, FTP, and more."
      features={[
        "Full SOCKS5 protocol support",
        "U.S. based locations",
        "Unlimited bandwidth",
        "Works with any application",
        "Username/password authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "5 Proxies", price: "$12", perProxy: "$2.40" },
        { name: "Basic", count: "10 Proxies", price: "$20", perProxy: "$2.00" },
        { name: "Standard", count: "25 Proxies", price: "$45", perProxy: "$1.80" },
        { name: "Premium", count: "50 Proxies", price: "$75", perProxy: "$1.50" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
```

- [ ] **Step 5: Create Residential Proxies page**

Create `src/app/(marketing)/residential-proxies/page.tsx`:
```tsx
import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Residential Proxies — ProxiesNow",
  description: "Buy residential proxies based in the USA with multiple ISPs.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=4`
  : "#";

export default function ResidentialProxiesPage() {
  return (
    <ProductPage
      title="Residential Proxies"
      subtitle="Real residential IPs from ISPs across the USA"
      description="Our residential proxies are sourced from real ISPs across the country, giving you the most authentic browsing experience with the lowest detection rates."
      features={[
        "Real residential IP addresses",
        "Multiple ISPs across the USA",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Lowest detection rates",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "5 Proxies", price: "$15", perProxy: "$3.00" },
        { name: "Basic", count: "10 Proxies", price: "$25", perProxy: "$2.50" },
        { name: "Standard", count: "25 Proxies", price: "$56", perProxy: "$2.24" },
        { name: "Premium", count: "50 Proxies", price: "$100", perProxy: "$2.00" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add product pages (private, shared, SOCKS5, residential)"
```

---

### Task 12: FAQ, Contact, Legal Pages

**Files:**
- Create: `src/app/(marketing)/faq/page.tsx`
- Create: `src/app/(marketing)/contact/page.tsx`
- Create: `src/app/(marketing)/contact/contact-form.tsx`
- Create: `src/app/api/contact/route.ts`
- Create: `src/app/(marketing)/privacy-policy/page.tsx`
- Create: `src/app/(marketing)/tos/page.tsx`

- [ ] **Step 1: Create FAQ page**

Create `src/app/(marketing)/faq/page.tsx`:
```tsx
import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FAQ — ProxiesNow",
  description: "Frequently asked questions about our proxy services.",
};

const faqs = [
  {
    q: "What is a private proxy?",
    a: "A private proxy is an IP address that is exclusively assigned to you. No one else can use this proxy while it is assigned to your account.",
  },
  {
    q: "What is a shared proxy?",
    a: "A shared proxy is an IP address shared between a small number of users (maximum 3). This keeps costs lower while maintaining good performance.",
  },
  {
    q: "What is a SOCKS5 proxy?",
    a: "SOCKS5 is a versatile proxy protocol that supports any type of traffic — HTTP, HTTPS, FTP, SMTP, and more. It offers better performance and flexibility than standard HTTP proxies.",
  },
  {
    q: "How do I use the proxies?",
    a: "After purchase, you will receive a list of proxy IPs, ports, and credentials in your dashboard. You can use these in any software that supports proxy connections.",
  },
  {
    q: "Do you offer unlimited bandwidth?",
    a: "Yes! All of our proxy plans include unlimited bandwidth at no additional cost.",
  },
  {
    q: "What locations are available?",
    a: "All of our proxies are located in multiple cities across the United States.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a refund within the first 3 days of purchase if you are not satisfied with our service. Please contact support for assistance.",
  },
  {
    q: "How fast are the proxies?",
    a: "All of our proxies are hosted on servers with at least 1Gbps connections, ensuring fast and reliable performance.",
  },
];

export default function FAQPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-semibold text-navy">{faq.q}</h3>
                <p className="mt-2 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Create Contact form component**

Create `src/app/(marketing)/contact/contact-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-center text-lg text-accent-600">
        Thank you! Your message has been sent. We will get back to you shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-navy">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-navy">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send Message"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Create Contact page and API route**

Create `src/app/(marketing)/contact/page.tsx`:
```tsx
import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — ProxiesNow",
  description: "Get in touch with our support team.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-navy-200">Have a question? We would love to hear from you.</p>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-xl">
            <ContactForm />
          </div>
        </Container>
      </section>
    </>
  );
}
```

Install Resend:
```bash
npm install resend
```

Create `src/app/api/contact/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "ProxiesNow <noreply@proxiesnow.com>",
      to: "support@proxiesnow.com",
      replyTo: email,
      subject: `Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create Privacy Policy page**

Create `src/app/(marketing)/privacy-policy/page.tsx`:
```tsx
import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy — ProxiesNow",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="prose mx-auto max-w-3xl">
            <p>Last updated: March 2026</p>
            <h2>Information We Collect</h2>
            <p>We collect information you provide when creating an account, purchasing services, or contacting us. This includes your name, email address, and billing information processed through our billing system.</p>
            <h2>How We Use Your Information</h2>
            <p>We use your information to provide and improve our proxy services, process payments, communicate with you about your account, and provide customer support.</p>
            <h2>Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. Proxy authentication credentials are stored securely and are only accessible through your account dashboard.</p>
            <h2>Cookies</h2>
            <p>We use essential cookies for session management and authentication. These cookies are necessary for the site to function properly.</p>
            <h2>Contact</h2>
            <p>If you have questions about this privacy policy, please contact us through our contact page.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 5: Create Terms of Service page**

Create `src/app/(marketing)/tos/page.tsx`:
```tsx
import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service — ProxiesNow",
};

export default function TOSPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="prose mx-auto max-w-3xl">
            <p>Last updated: March 2026</p>
            <h2>Acceptable Use</h2>
            <p>Our proxy services may not be used for any illegal activities, spamming, hacking, or any activity that violates applicable laws. We reserve the right to terminate accounts that violate these terms.</p>
            <h2>Service Availability</h2>
            <p>We strive to maintain 99.9% uptime for our proxy services. Scheduled maintenance will be communicated in advance when possible.</p>
            <h2>Refund Policy</h2>
            <p>We offer a 3-day refund policy from the date of purchase. Refund requests must be submitted through our contact page or support system.</p>
            <h2>Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.</p>
            <h2>Limitation of Liability</h2>
            <p>ProxiesNow is not liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
            <h2>Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services constitutes acceptance of the updated terms.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 6: Install @tailwindcss/typography for prose classes**

Run: `npm install @tailwindcss/typography`

Add to `tailwind.config.ts`:
```typescript
import typography from "@tailwindcss/typography";
```
Then add `typography` to the `plugins` array: `plugins: [typography]`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add FAQ, contact, privacy policy, and TOS pages"
```

---

## Chunk 5: Blog (MDX)

### Task 13: Blog Infrastructure

**Files:**
- Create: `src/app/(marketing)/blog/page.tsx`
- Create: `src/app/(marketing)/blog/[slug]/page.tsx`
- Create: `src/lib/blog.ts`
- Create: `content/blog/welcome.mdx`

- [ ] **Step 1: Install MDX dependencies**

Run:
```bash
npm install next-mdx-remote gray-matter
```

- [ ] **Step 2: Create blog utility**

Create `src/lib/blog.ts`:
```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
};

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const filePath = path.join(BLOG_DIR, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      return {
        slug: filename.replace(".mdx", ""),
        title: data.title || "Untitled",
        date: data.date || "",
        excerpt: data.excerpt || "",
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}
```

- [ ] **Step 3: Create blog listing page**

Create `src/app/(marketing)/blog/page.tsx`:
```tsx
import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — ProxiesNow",
  description: "News, tips, and updates from ProxiesNow.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Blog</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {posts.length === 0 && (
              <p className="text-center text-gray-500">No posts yet. Check back soon!</p>
            )}
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-gray-100 pb-8">
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-navy hover:text-accent">
                    {post.title}
                  </h2>
                </Link>
                <p className="mt-1 text-sm text-gray-500">{post.date}</p>
                <p className="mt-3 text-gray-600">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Create blog post page**

Create `src/app/(marketing)/blog/[slug]/page.tsx`:
```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/container";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — ProxiesNow Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <p className="mt-4 text-navy-200">{post.date}</p>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <article className="prose mx-auto max-w-3xl">
            <MDXRemote source={post.content} />
          </article>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 5: Create sample blog post**

Create `content/blog/welcome.mdx`:
```mdx
---
title: "Welcome to ProxiesNow"
date: "2026-03-11"
excerpt: "Introducing our new website and improved proxy services."
---

We are excited to announce the launch of our redesigned website! Along with a fresh new look, we have made several improvements to our proxy services.

## What's New

- **Improved Dashboard** — Manage your proxies with ease from our new customer dashboard.
- **Self-Service Actions** — Regenerate credentials, replace IPs, and toggle proxies on or off directly from your account.
- **Faster Performance** — We have upgraded our infrastructure for even better speeds.

## Our Proxy Services

Whether you need private proxies, shared proxies, SOCKS5 proxies, or residential proxies, we have you covered. All plans include unlimited bandwidth and 24/7 support.

Visit our product pages to learn more and get started today!
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add blog with MDX support and sample post"
```

---

## Chunk 6: Login Page and Dashboard

### Task 14: Login Page

**Files:**
- Create: `src/app/(marketing)/login/page.tsx`
- Create: `src/app/(marketing)/login/login-form.tsx`
- Create: `src/app/(marketing)/logout/page.tsx`

- [ ] **Step 1: Create Login form component**

Create `src/app/(marketing)/login/login-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create Login page**

Create `src/app/(marketing)/login/page.tsx`:
```tsx
import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — ProxiesNow",
};

export default function LoginPage() {
  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-md">
          <h1 className="text-center text-3xl font-bold text-navy">Sign In</h1>
          <p className="mt-2 text-center text-gray-600">
            Access your proxy dashboard
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Create Logout page**

Create `src/app/(marketing)/logout/page.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/");
    });
  }, [router]);

  return (
    <section className="flex flex-1 items-center justify-center py-20">
      <p className="text-gray-500">Signing out...</p>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add login and logout pages"
```

---

### Task 15: Dashboard Layout and Overview

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/sidebar.tsx`
- Create: `src/components/dashboard/dashboard-header.tsx`

- [ ] **Step 1: Create dashboard sidebar**

Create `src/components/dashboard/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/proxies", label: "My Proxies" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-navy">
          ProxiesNow
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-accent/10 text-accent-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create dashboard header**

Create `src/components/dashboard/dashboard-header.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setName(data.user.name);
      });
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4">
      <p className="text-sm text-gray-600">
        Welcome back{name ? `, ${name}` : ""}
      </p>
    </header>
  );
}
```

- [ ] **Step 3: Create dashboard layout (no site header/footer)**

Create `src/app/dashboard/layout.tsx`:
```tsx
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create dashboard overview page**

Create `src/app/dashboard/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

type Service = {
  id: number;
  name: string;
  status: string;
  domain: string;
};

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(data.services || []))
      .catch(() => setError("Failed to load services. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading services...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 && (
          <p className="text-gray-500">No active services found.</p>
        )}
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <h3 className="font-semibold text-navy">{service.name}</h3>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                service.status === "Active"
                  ? "bg-accent/10 text-accent-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create services API route**

Create `src/app/api/services/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getClientProducts } from "@/lib/whmcs";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await getClientProducts(session.whmcsClientId);
    return NextResponse.json({ services: products });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dashboard layout, overview, and route groups"
```

---

### Task 16: Proxy List and Detail Dashboard Pages

**Files:**
- Create: `src/app/dashboard/proxies/page.tsx`
- Create: `src/app/dashboard/proxies/[id]/page.tsx`

- [ ] **Step 1: Create proxy list page**

Create `src/app/dashboard/proxies/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProxyData = {
  id: string;
  proxy: {
    id: string;
    ip: string;
    port: number;
    protocol: string;
    status: string;
    username: string;
  };
};

export default function ProxiesPage() {
  const [proxies, setProxies] = useState<ProxyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxies")
      .then((r) => r.json())
      .then((data) => setProxies(data.proxies || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading proxies...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">My Proxies</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-600">IP</th>
              <th className="px-6 py-3 font-medium text-gray-600">Port</th>
              <th className="px-6 py-3 font-medium text-gray-600">Protocol</th>
              <th className="px-6 py-3 font-medium text-gray-600">Username</th>
              <th className="px-6 py-3 font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {proxies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No proxies found.
                </td>
              </tr>
            )}
            {proxies.map((p) => (
              <tr key={p.proxy.id}>
                <td className="px-6 py-4 font-mono">{p.proxy.ip}</td>
                <td className="px-6 py-4 font-mono">{p.proxy.port}</td>
                <td className="px-6 py-4">{p.proxy.protocol}</td>
                <td className="px-6 py-4 font-mono">{p.proxy.username}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      p.proxy.status === "active"
                        ? "bg-accent/10 text-accent-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.proxy.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/proxies/${p.proxy.id}`}
                    className="text-sm font-medium text-accent hover:text-accent-700"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create proxy detail page**

Create `src/app/dashboard/proxies/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ProxyDetail = {
  proxy: {
    id: string;
    whmcsClientId: number;
    whmcsServiceId: number;
    proxyId: string;
    proxy: {
      id: string;
      ip: string;
      port: number;
      protocol: string;
      status: string;
      username: string;
      password: string;
      serverHost: string;
      usageLogs: { bandwidthUsed: string; recordedAt: string }[];
    };
  };
};

export default function ProxyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProxyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetch(`/api/proxies/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/proxies/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        // Refresh data
        const updated = await fetch(`/api/proxies/${id}`).then((r) => r.json());
        setData(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } finally {
      setActionLoading("");
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!data) return <p className="text-red-600">Proxy not found.</p>;

  const proxy = data.proxy.proxy;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-navy"
      >
        &larr; Back to proxies
      </button>

      <h1 className="mt-4 text-2xl font-bold text-navy">
        {proxy.ip}:{proxy.port}
      </h1>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-navy">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">IP Address</dt>
              <dd className="font-mono">{proxy.ip}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Port</dt>
              <dd className="font-mono">{proxy.port}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Protocol</dt>
              <dd>{proxy.protocol}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Server</dt>
              <dd className="font-mono">{proxy.serverHost}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    proxy.status === "active"
                      ? "bg-accent/10 text-accent-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {proxy.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-navy">Credentials</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Username</dt>
              <dd className="font-mono">{proxy.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Password</dt>
              <dd className="font-mono">{proxy.password}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() => handleAction("regenerate")}
          variant="outline"
          size="sm"
          disabled={!!actionLoading}
        >
          {actionLoading === "regenerate" ? "Regenerating..." : "Regenerate Credentials"}
        </Button>
        <Button
          onClick={() => handleAction("replace")}
          variant="outline"
          size="sm"
          disabled={!!actionLoading}
        >
          {actionLoading === "replace" ? "Replacing..." : "Replace IP"}
        </Button>
        <Button
          onClick={() => handleAction("toggle")}
          variant={proxy.status === "active" ? "outline" : "primary"}
          size="sm"
          disabled={!!actionLoading}
        >
          {actionLoading === "toggle"
            ? "Updating..."
            : proxy.status === "active"
              ? "Deactivate"
              : "Activate"}
        </Button>
      </div>

      {proxy.usageLogs && proxy.usageLogs.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-navy">Recent Usage</h2>
          <div className="mt-4 space-y-2 text-sm">
            {proxy.usageLogs.map((log, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-500">
                  {new Date(log.recordedAt).toLocaleDateString()}
                </span>
                <span className="font-mono">
                  {(Number(log.bandwidthUsed) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add proxy list and detail dashboard pages with usage display"
```

---

## Chunk 7: Error Pages and Deployment

### Task 17: Error Pages

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`

- [ ] **Step 1: Create 404 page**

Create `src/app/not-found.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="text-center">
        <h1 className="text-6xl font-bold text-navy">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found.</p>
        <div className="mt-8">
          <Button href="/">Go Home</Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create error page**

Create `src/app/error.tsx`:
```tsx
"use client";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="text-center">
        <h1 className="text-6xl font-bold text-navy">500</h1>
        <p className="mt-4 text-lg text-gray-600">Something went wrong.</p>
        <div className="mt-8">
          <Button onClick={reset}>Try Again</Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add custom 404 and 500 error pages"
```

---

### Task 18: Railway Deployment Config

**Files:**
- Create: `railway.toml`
- Verify: `.env.example` has all vars

- [ ] **Step 1: Create railway.toml**

Create `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npx prisma migrate deploy && npm start"
healthcheckPath = "/"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

- [ ] **Step 2: Verify build works**

Run:
```bash
npm run build
```
Expected: Build completes without errors

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Railway deployment config"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin master
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-6 | Project scaffold, Prisma, WHMCS client, auth |
| 2 | 7-8 | Proxy service, API routes, webhook |
| 3 | 9 | Shared UI components and layout |
| 4 | 10-12 | Marketing pages (home, products, FAQ, contact, legal) |
| 5 | 13 | Blog with MDX |
| 6 | 14-16 | Login, dashboard layout, proxy management UI |
| 7 | 17-18 | Error pages, Railway deployment |
