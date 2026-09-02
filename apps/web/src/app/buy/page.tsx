import { redirect } from "next/navigation";

export default function BuyPage() {
  redirect("/properties?operationType=SALE");
}
