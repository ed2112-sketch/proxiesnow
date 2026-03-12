import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy — ProxiesNow",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-navy-800 to-navy py-20 text-white">
        <Container className="text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="prose mx-auto max-w-3xl">
            <p>Last updated: March 2026</p>
            <h2>Information We Collect</h2>
            <p>We collect information you provide when creating an account, purchasing services, or contacting us. This includes your name, email address, and billing information processed through our billing system.</p>
            <h2>How We Use Your Information</h2>
            <p>We use your information to provide and improve our proxy services, process payments, communicate with you about your account, and provide customer support.</p>
            <h2>Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. Proxy authentication credentials are stored securely and are only accessible through your account dashboard.</p>
            <h2>Cookies</h2>
            <p>We use essential cookies for session management and authentication. These cookies are necessary for the site to function properly.</p>
            <h2>Contact</h2>
            <p>If you have questions about this privacy policy, please contact us through our contact page.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
