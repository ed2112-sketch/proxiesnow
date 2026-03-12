import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service — ProxiesNow",
};

export default function TOSPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="prose mx-auto max-w-3xl">
            <p>Last updated: March 2026</p>
            <h2>Acceptable Use</h2>
            <p>Our proxy services may not be used for any illegal activities, spamming, hacking, or any activity that violates applicable laws. We reserve the right to terminate accounts that violate these terms.</p>
            <h2>Service Availability</h2>
            <p>We strive to maintain 99.9% uptime for our proxy services. Scheduled maintenance will be communicated in advance when possible.</p>
            <h2>Refund Policy</h2>
            <p>We offer a 3-day refund policy from the date of purchase. Refund requests must be submitted through our contact page or support system.</p>
            <h2>Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.</p>
            <h2>Limitation of Liability</h2>
            <p>ProxiesNow is not liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
            <h2>Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services constitutes acceptance of the updated terms.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
