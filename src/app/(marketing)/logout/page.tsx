"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/");
    });
  }, [router]);

  return (
    <section className="flex flex-1 items-center justify-center py-20">
      <p className="text-gray-500">Signing out...</p>
    </section>
  );
}
