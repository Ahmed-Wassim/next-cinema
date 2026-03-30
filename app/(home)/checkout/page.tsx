import { Suspense } from "react";
import { CheckoutPageInner } from "./CheckoutPageInner";

export const metadata = {
  title: "Checkout — CineBook",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
