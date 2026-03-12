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
