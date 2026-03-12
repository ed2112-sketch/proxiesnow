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
