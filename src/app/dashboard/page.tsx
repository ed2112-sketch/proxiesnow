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
