import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — ProxiesNow",
  description: "Get in touch with our support team.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-navy-200">Have a question? We would love to hear from you.</p>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-xl">
            <ContactForm />
          </div>
        </Container>
      </section>
    </>
  );
}
