import { notFound } from "next/navigation";
import { getBookingConfirmation } from "@/services/homeService";
import { TicketCard } from "@/components/home/TicketCard";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Booking Confirmed — CineBook",
};

export default async function BookingSuccessPage({ params }: Props) {
  const { id } = await params;

  let booking;
  try {
    const res = await getBookingConfirmation(id);
    booking = res.data?.data;
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-2">
          Payment Successful
        </p>
        <h1 className="text-3xl font-extrabold text-white">
          Enjoy the Show! 🎬
        </h1>
        <p className="mt-2 text-zinc-400 text-sm max-w-sm mx-auto">
          Your tickets are confirmed. Present the booking reference or QR code at the entrance.
        </p>
      </div>

      <TicketCard booking={booking} />

      <Link
        href="/movies"
        className="text-sm text-zinc-400 hover:text-amber-400 transition-colors underline underline-offset-4"
      >
        ← Browse more movies
      </Link>
    </div>
  );
}
