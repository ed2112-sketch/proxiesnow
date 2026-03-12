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
          usageLogs: { orderBy: { recordedAt: "desc" }, take: 1 },
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
          usageLogs: { orderBy: { recordedAt: "desc" }, take: 30 },
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
      data: { whmcsClientId, whmcsServiceId: userProxy.whmcsServiceId, proxyId: replacement.id },
    }),
    prisma.proxy.update({ where: { id: replacement.id }, data: { status: "active" } }),
  ]);

  return replacement;
}

export async function provisionProxies(clientId: number, serviceId: number, productType: string, quantity: number) {
  const existing = await prisma.userProxy.findFirst({ where: { whmcsServiceId: serviceId } });
  if (existing) return { alreadyProvisioned: true };

  const protocol: Protocol = productType.toUpperCase().includes("SOCKS") ? "SOCKS5" : "HTTP";

  const available = await prisma.proxy.findMany({
    where: { protocol, status: "inactive", userProxies: { none: {} } },
    take: quantity,
  });

  if (available.length < quantity) {
    throw new Error(`Not enough proxies available. Need ${quantity}, found ${available.length}`);
  }

  await prisma.$transaction([
    ...available.map((p) => prisma.userProxy.create({ data: { whmcsClientId: clientId, whmcsServiceId: serviceId, proxyId: p.id } })),
    ...available.map((p) => prisma.proxy.update({ where: { id: p.id }, data: { status: "active" } })),
  ]);

  return { alreadyProvisioned: false, assigned: available.length };
}
