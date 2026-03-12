import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { Products } from "@/components/home/products";
import { Testimonials } from "@/components/home/testimonials";
import { CTA } from "@/components/home/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Products />
      <Testimonials />
      <CTA />
    </>
  );
}
