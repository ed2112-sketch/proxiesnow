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
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await provisionProxies(Number(client_id), Number(service_id), product_type, Number(quantity));
    if (result.alreadyProvisioned) {
      return NextResponse.json({ message: "Already provisioned" }, { status: 200 });
    }
    return NextResponse.json({ message: "Provisioned", assigned: result.assigned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
