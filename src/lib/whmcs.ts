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
  const data = await whmcsApi("ValidateLogin", { email, password2: password });
  if (data.result === "success") {
    return { success: true, userId: data.userid as number };
  }
  return { success: false, userId: null };
}

export async function getClientDetails(clientId: number): Promise<Record<string, unknown>> {
  const data = await whmcsApi("GetClientsDetails", { clientid: clientId.toString() });
  return data.client as Record<string, unknown>;
}

export async function getClientProducts(clientId: number): Promise<Record<string, unknown>[]> {
  const data = await whmcsApi("GetClientsProducts", { clientid: clientId.toString() });
  const products = data.products as { product: Record<string, unknown>[] };
  return products.product ?? [];
}
