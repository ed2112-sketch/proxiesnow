import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const products = [
  {
    title: "Residential Proxies",
    description:
      "Residential proxies based in the USA. Hosted with many different ISPs around the country.",
    href: "/residential-proxies",
  },
  {
    title: "Private Proxies",
    description:
      "Private proxies are the ultimate in online security. Located in multiple cities in the U.S., available for your usage only.",
    href: "/private-proxies",
  },
  {
    title: "SOCKS5 Proxies",
    description:
      "SOCKS5 proxies are the ultimate in online security. We have locations around the U.S.A.",
    href: "/socks5-proxies",
  },
];

export function Products() {
  return (
    <section className="bg-gray-50 py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          Choose Your Server
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.title}
              className="flex flex-col rounded-xl bg-white p-8 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-navy">{product.title}</h3>
              <p className="mt-4 flex-1 text-gray-600">{product.description}</p>
              <div className="mt-6">
                <Button href={product.href} variant="secondary" size="sm">
                  Order Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
