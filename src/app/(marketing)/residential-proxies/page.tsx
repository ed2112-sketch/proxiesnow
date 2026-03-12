import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Residential Proxies — ProxiesNow",
  description: "Buy residential proxies based in the USA with multiple ISPs.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=4`
  : "#";

export default function ResidentialProxiesPage() {
  return (
    <ProductPage
      title="Residential Proxies"
      subtitle="Real residential IPs from ISPs across the USA"
      description="Our residential proxies are sourced from real ISPs across the country, giving you the most authentic browsing experience with the lowest detection rates."
      features={[
        "Real residential IP addresses",
        "Multiple ISPs across the USA",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Lowest detection rates",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "10 Proxies", price: "$12.50", perProxy: "$1.25" },
        { name: "Basic", count: "20 Proxies", price: "$23", perProxy: "$1.15" },
        { name: "Standard", count: "50 Proxies", price: "$55", perProxy: "$1.10" },
        { name: "Premium", count: "100 Proxies", price: "$100", perProxy: "$1.00" },
        { name: "Enterprise", count: "200 Proxies", price: "$175", perProxy: "$0.88" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
