import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getProxyForClient, regenerateProxyCredentials } from "@/lib/proxy-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
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
