import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="bg-accent py-16">
      <Container className="text-center">
        <h2 className="text-3xl font-bold text-white">Order Today!</h2>
        <div className="mt-8">
          <Button href="/private-proxies" variant="secondary" size="lg">
            Get Started Now
          </Button>
        </div>
      </Container>
    </section>
  );
}
