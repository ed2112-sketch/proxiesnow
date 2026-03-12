import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { replaceProxyIp } from "@/lib/proxy-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
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
