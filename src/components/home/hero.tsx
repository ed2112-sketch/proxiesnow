import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-navy-800 to-navy py-24 text-white">
      <Container className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Private Proxies from ProxiesNow
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-200">
          We provide the best proxies at the lowest prices. Unlimited bandwidth
          and support. No more searching for public proxy lists that are
          outdated and slow.
        </p>
        <div className="mt-10">
          <Button href="/private-proxies" size="lg">
            Get Started Now
          </Button>
        </div>
      </Container>
    </section>
  );
}
