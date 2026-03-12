import { Container } from "@/components/ui/container";

const testimonials = [
  { name: "Zach F.", location: "Estonia", quote: "Great proxies and support! The best value. Thanks!" },
  { name: "David L.", location: "Barbados", quote: "Quality service and fast response time. Overall very good service. Thank you." },
  { name: "Tyler W.", location: "New Zealand", quote: "The best proxy service we have ever used!" },
  { name: "Samuel A.", location: "Canada", quote: "You can not beat these prices. The proxies are great." },
  { name: "Brandon L.", location: "USA", quote: "Our business has benefited greatly since we ordered our proxies from ProxiesNow.com." },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <Container>
        <h2 className="text-center text-3xl font-bold text-navy">
          What Our Clients Say
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-gray-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <p className="font-semibold text-navy">{t.name}</p>
                <p className="text-sm text-gray-500">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
