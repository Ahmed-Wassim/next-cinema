"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/home/CustomerForm";
import { createBooking, initiateCheckout } from "@/services/homeService";
import type { BookingCustomer } from "@/types/home";
import { AlertCircle } from "lucide-react";

interface Props {
  showtimeId: number;
  seatIds: number[];
}

export function CheckoutClient({ showtimeId, seatIds }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("");

  async function handleSubmit(customer: BookingCustomer) {
    setError(null);
    setIsLoading(true);

    try {
      // Step 4: Create booking
      setStep("Creating your booking…");
      const bookingRes = await createBooking({
        showtime_id: showtimeId,
        seat_ids: seatIds,
        customer,
      });
      const bookingId = bookingRes.data.data.id;

      // Step 5: Initiate checkout
      setStep("Preparing payment…");
      const checkoutRes = await initiateCheckout({
        booking_id: bookingId,
        customer_name: customer.name,
        customer_email: customer.email,
      });

      // Redirect to PayTabs
      if (checkoutRes.data.redirect_url) {
        window.location.href = checkoutRes.data.redirect_url;
      } else {
        // Fallback: go straight to success page
        router.push(`/booking/${bookingId}/success`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      setIsLoading(false);
      setStep("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {isLoading && step && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-3 text-sm text-[var(--accent)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          {step}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
