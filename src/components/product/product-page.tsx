import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

type PricingTier = {
  name: string;
  count: string;
  price: string;
  perProxy: string;
};

type ProductPageProps = {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  pricingTiers: PricingTier[];
  orderUrl: string;
};

export function ProductPage({
  title,
  subtitle,
  description,
  features,
  pricingTiers,
  orderUrl,
}: ProductPageProps) {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-4 text-lg text-navy-200">{subtitle}</p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-lg text-gray-600">{description}</p>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-gray-50 py-16">
        <Container>
          <h2 className="text-center text-3xl font-bold text-navy">Pricing</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col rounded-xl bg-white p-6 text-center shadow-sm"
              >
                <h3 className="text-lg font-semibold text-navy">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.count}</p>
                <p className="mt-4 text-3xl font-bold text-navy">{tier.price}</p>
                <p className="text-sm text-gray-500">/month</p>
                <p className="mt-2 text-sm text-accent-600">{tier.perProxy} per proxy</p>
                <div className="mt-6">
                  <Button href={orderUrl} size="sm">
                    Order Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
