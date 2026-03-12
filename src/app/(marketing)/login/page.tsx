import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — ProxiesNow",
};

export default function LoginPage() {
  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-md">
          <h1 className="text-center text-3xl font-bold text-navy">Sign In</h1>
          <p className="mt-2 text-center text-gray-600">
            Access your proxy dashboard
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
