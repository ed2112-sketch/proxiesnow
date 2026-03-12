import { Metadata } from "next";
import { ProductPage } from "@/components/product/product-page";

export const metadata: Metadata = {
  title: "SOCKS5 Proxies — ProxiesNow",
  description: "Buy SOCKS5 proxies with unlimited bandwidth. U.S. locations.",
};

const WHMCS_ORDER_URL = process.env.NEXT_PUBLIC_WHMCS_URL
  ? `${process.env.NEXT_PUBLIC_WHMCS_URL}/cart.php?a=add&pid=3`
  : "#";

export default function Socks5ProxiesPage() {
  return (
    <ProductPage
      title="SOCKS5 Proxies"
      subtitle="The ultimate in online security"
      description="SOCKS5 proxies provide a versatile, high-performance connection. Support for any protocol including HTTP, HTTPS, FTP, and more."
      features={[
        "Full SOCKS5 protocol support",
        "U.S. based locations",
        "Unlimited bandwidth",
        "Works with any application",
        "Username/password authentication",
        "24/7 support",
      ]}
      pricingTiers={[
        { name: "Starter", count: "10 Proxies", price: "$12.50", perProxy: "$1.25" },
        { name: "Basic", count: "20 Proxies", price: "$23", perProxy: "$1.15" },
        { name: "Standard", count: "50 Proxies", price: "$55", perProxy: "$1.10" },
        { name: "Premium", count: "100 Proxies", price: "$100", perProxy: "$1.00" },
      ]}
      orderUrl={WHMCS_ORDER_URL}
    />
  );
}
