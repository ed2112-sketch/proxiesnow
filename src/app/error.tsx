"use client";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="text-center">
        <h1 className="text-6xl font-bold text-navy">500</h1>
        <p className="mt-4 text-lg text-gray-600">Something went wrong.</p>
        <div className="mt-8">
          <Button onClick={reset}>Try Again</Button>
        </div>
      </Container>
    </section>
  );
}
