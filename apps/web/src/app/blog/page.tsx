import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <ComingSoon
      title="Blog y guías"
      description="Guías para comprar, invertir, alquilar y financiar en República Dominicana."
      phase="fase 2"
    />
  );
}
