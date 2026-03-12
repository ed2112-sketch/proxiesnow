import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Unlimited Bandwidth",
    description: "Never worry about how much bandwidth you use.",
  },
  {
    title: "Fast Server Speeds",
    description: "All proxies hosted on at least 1Gbps connections.",
  },
  {
    title: "24/7 Support",
    description: "99.9% uptime. Need a question answered? Ask us anytime!",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          Why Choose ProxiesNow?
        </h2>
        <p className="mt-4 text-center text-gray-600">
          An ultra fast and super simple proxy service for all your needs.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm"
            >
              <h3 className="text-lg font-semibold text-navy">{feature.title}</h3>
              <p className="mt-3 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
