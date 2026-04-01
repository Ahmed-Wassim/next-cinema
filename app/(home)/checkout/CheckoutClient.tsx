"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BadgePercent, CheckCircle2 } from "lucide-react";

import { CustomerForm } from "@/components/home/CustomerForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBooking,
  initiateCheckout,
  validateCouponCode,
} from "@/services/homeService";
import type { CouponValidationResponse } from "@/types/discount";
import type { BookingCustomer } from "@/types/home";

interface Props {
  showtimeId: number;
  seatIds: number[];
  initialOfferPercentage?: number;
}

interface AppliedCoupon {
  code: string;
  message: string;
  currency?: string | null;
  subtotal?: number | null;
  offerDiscount?: number | null;
  couponDiscount?: number | null;
  totalPrice?: number | null;
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(value?: number | null, currency?: string | null) {
  if (value === null || value === undefined) return null;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value.toFixed(2)}`;
  }
}

function normalizeCouponResult(
  response: CouponValidationResponse,
  fallbackCode: string,
) {
  const payload =
    response.data && typeof response.data === "object" ? response.data : response;

  return {
    code: String(payload.code || fallbackCode).toUpperCase(),
    message:
      String(payload.message || "Coupon applied successfully.") ||
      "Coupon applied successfully.",
    currency:
      typeof payload.currency === "string" ? payload.currency : undefined,
    subtotal: asNumber(payload.subtotal ?? payload.original_total),
    offerDiscount: asNumber(payload.offer_discount),
    couponDiscount: asNumber(
      payload.coupon_discount ?? payload.discount_amount,
    ),
    totalPrice: asNumber(
      payload.total_price ?? payload.final_total ?? payload.total_after_discount,
    ),
  } satisfies AppliedCoupon;
}

export function CheckoutClient({
  showtimeId,
  seatIds,
  initialOfferPercentage = 0,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const seatKey = useMemo(() => seatIds.join(","), [seatIds]);

  async function applyCoupon(codeOverride?: string) {
    const normalizedCode = (codeOverride ?? couponCode).trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Enter a coupon code first.");
      setAppliedCoupon(null);
      return null;
    }

    setCouponError(null);
    setIsValidatingCoupon(true);

    try {
      const response = await validateCouponCode({
        code: normalizedCode,
        showtime_id: showtimeId,
        seat_ids: seatIds,
      });
      const normalized = normalizeCouponResult(response.data, normalizedCode);
      setCouponCode(normalized.code);
      setAppliedCoupon(normalized);
      return normalized;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "This coupon could not be validated.";
      setCouponError(msg);
      setAppliedCoupon(null);
      return null;
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  async function handleSubmit(customer: BookingCustomer) {
    setError(null);
    setIsLoading(true);

    try {
      const submittedCouponCode = couponCode.trim().toUpperCase() || undefined;

      setStep("Creating your booking...");
      const bookingRes = await createBooking({
        showtime_id: showtimeId,
        seat_ids: seatIds,
        customer,
        coupon_code: submittedCouponCode,
      });
      const bookingId = bookingRes.data.data.id;

      setStep("Preparing payment...");
      const checkoutRes = await initiateCheckout({
        booking_id: bookingId,
      });

      if (checkoutRes.data.redirect_url) {
        window.location.href = checkoutRes.data.redirect_url;
      } else {
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
      {initialOfferPercentage > 0 ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-start gap-3">
            <BadgePercent className="mt-0.5 h-4 w-4 text-emerald-300" />
            <div>
              <h3 className="font-semibold">Showtime offer applied</h3>
              <p className="mt-1 text-emerald-200/85">
                This booking already includes a {initialOfferPercentage.toFixed(0)}%
                showtime discount before any coupon code is applied.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/40 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[var(--accent)]/14 p-2 text-[var(--accent)]">
            <BadgePercent className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Coupon code
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Validate offers against this showtime and the {seatIds.length}{" "}
                selected seat{seatIds.length > 1 ? "s" : ""} before payment.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={couponCode}
                onChange={(event) => {
                  const nextCode = event.target.value.toUpperCase();
                  setCouponCode(nextCode);
                  setCouponError(null);
                  if (appliedCoupon?.code !== nextCode) {
                    setAppliedCoupon(null);
                  }
                }}
                placeholder="SUMMER10"
                className="h-11"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:min-w-36"
                onClick={() => void applyCoupon()}
                disabled={isLoading || isValidatingCoupon}
              >
                {isValidatingCoupon ? "Validating..." : "Apply coupon"}
              </Button>
            </div>

            {couponError ? (
              <div className="rounded-xl border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {couponError}
              </div>
            ) : null}

            {appliedCoupon ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">
                        {appliedCoupon.code} applied
                      </p>
                      <p className="text-sm text-emerald-200/85">
                        {appliedCoupon.message}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-emerald-100 sm:grid-cols-4">
                      <div className="rounded-lg bg-black/10 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                          Subtotal
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatAmount(
                            appliedCoupon.subtotal,
                            appliedCoupon.currency,
                          ) ?? "From server"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/10 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                          Offer discount
                        </p>
                        <p className="mt-1 font-semibold">
                          -{formatAmount(
                            appliedCoupon.offerDiscount,
                            appliedCoupon.currency,
                          ) ?? "0"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/10 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                          Coupon discount
                        </p>
                        <p className="mt-1 font-semibold">
                          -{formatAmount(
                            appliedCoupon.couponDiscount,
                            appliedCoupon.currency,
                          ) ?? "0"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/10 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                          Total
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatAmount(
                            appliedCoupon.totalPrice,
                            appliedCoupon.currency,
                          ) ?? "From server"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-[var(--text-secondary)]">
              Seats in this checkout: {seatKey || "none"}.
            </p>
          </div>
        </div>
      </div>

      {isLoading && step && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-3 text-sm text-[var(--accent)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          {step}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
