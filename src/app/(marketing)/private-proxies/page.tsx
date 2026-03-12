import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Private Proxies — ProxiesNow",
  description: "Buy private proxies with unlimited bandwidth. Located in multiple U.S. cities.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=1`
  : "#";

export default function PrivateProxiesPage() {
  return (
    <ProductPage
      title="Private Proxies"
      subtitle="Dedicated proxies for your exclusive use"
      description="Our private proxies are reliable, fast, and come with around the clock support. When you buy proxies from ProxiesNow you will receive a list of proxies that only you have access to."
      features={[
        "100% dedicated to you — no sharing",
        "Multiple U.S. city locations",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Username/password or IP authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "10 Proxies", price: "$10", perProxy: "$1.00" },
        { name: "Basic", count: "20 Proxies", price: "$15", perProxy: "$0.75" },
        { name: "Standard", count: "50 Proxies", price: "$30", perProxy: "$0.60" },
        { name: "Premium", count: "100 Proxies", price: "$50", perProxy: "$0.50" },
        { name: "Enterprise", count: "250 Proxies", price: "$100", perProxy: "$0.40" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
