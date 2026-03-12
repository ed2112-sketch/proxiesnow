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
