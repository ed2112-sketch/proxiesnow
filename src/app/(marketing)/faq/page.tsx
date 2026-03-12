import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FAQ — ProxiesNow",
  description: "Frequently asked questions about our proxy services.",
};

const faqs = [
  {
    q: "What is a private proxy?",
    a: "A private proxy is an IP address that is exclusively assigned to you. No one else can use this proxy while it is assigned to your account.",
  },
  {
    q: "What is a shared proxy?",
    a: "A shared proxy is an IP address shared between a small number of users (maximum 3). This keeps costs lower while maintaining good performance.",
  },
  {
    q: "What is a SOCKS5 proxy?",
    a: "SOCKS5 is a versatile proxy protocol that supports any type of traffic — HTTP, HTTPS, FTP, SMTP, and more. It offers better performance and flexibility than standard HTTP proxies.",
  },
  {
    q: "How do I use the proxies?",
    a: "After purchase, you will receive a list of proxy IPs, ports, and credentials in your dashboard. You can use these in any software that supports proxy connections.",
  },
  {
    q: "Do you offer unlimited bandwidth?",
    a: "Yes! All of our proxy plans include unlimited bandwidth at no additional cost.",
  },
  {
    q: "What locations are available?",
    a: "All of our proxies are located in multiple cities across the United States.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a refund within the first 3 days of purchase if you are not satisfied with our service. Please contact support for assistance.",
  },
  {
    q: "How fast are the proxies?",
    a: "All of our proxies are hosted on servers with at least 1Gbps connections, ensuring fast and reliable performance.",
  },
];

export default function FAQPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-semibold text-navy">{faq.q}</h3>
                <p className="mt-2 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
