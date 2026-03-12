import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "Shared Proxies — ProxiesNow",
  description: "Buy affordable shared proxies with unlimited bandwidth.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=2`
  : "#";

export default function SharedProxiesPage() {
  return (
    <ProductPage
      title="Shared Proxies"
      subtitle="Affordable proxies shared with a small group"
      description="Our shared proxies offer great performance at a lower cost. Each proxy is shared with a maximum of 3 users to maintain speed and reliability."
      features={[
        "Shared with maximum 3 users",
        "U.S. based locations",
        "Unlimited bandwidth",
        "HTTP/HTTPS support",
        "Username/password authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "10 Proxies", price: "$5", perProxy: "$0.50" },
        { name: "Basic", count: "20 Proxies", price: "$9", perProxy: "$0.45" },
        { name: "Standard", count: "50 Proxies", price: "$20", perProxy: "$0.40" },
        { name: "Premium", count: "100 Proxies", price: "$30", perProxy: "$0.30" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
