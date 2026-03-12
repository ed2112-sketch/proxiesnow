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
