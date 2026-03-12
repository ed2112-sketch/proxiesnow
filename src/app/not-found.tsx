import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="text-center">
        <h1 className="text-6xl font-bold text-navy">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found.</p>
        <div className="mt-8">
          <Button href="/">Go Home</Button>
        </div>
      </Container>
    </section>
  );
}
