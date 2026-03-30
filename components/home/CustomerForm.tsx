"use client";

import { useState } from "react";
import type { BookingCustomer } from "@/types/home";
import { cn } from "@/lib/utils";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface CustomerFormProps {
  onSubmit: (customer: BookingCustomer) => void;
  isLoading?: boolean;
}

export function CustomerForm({ onSubmit, isLoading = false }: CustomerFormProps) {
  const [form, setForm] = useState<BookingCustomer>({
    name: "",
    email: "",
    phone_country_code: "EG",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<BookingCustomer>>({});

  function validate(): boolean {
    const e: Partial<BookingCustomer> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required";
    if (!form.phone.trim() || form.phone.length < 6)
      e.phone = "Valid phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  function field(
    label: string,
    key: keyof BookingCustomer,
    type = "text",
    placeholder = ""
  ) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </label>
        <input
          type={type}
          value={form[key] as string}
          placeholder={placeholder}
          onChange={(e) =>
            setForm((f) => ({ ...f, [key]: e.target.value }))
          }
          className={cn(
            "w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors",
            errors[key]
              ? "border-red-500 focus:border-red-400"
              : "border-zinc-700 focus:border-amber-500"
          )}
        />
        {errors[key] && (
          <p className="text-xs text-red-400">{errors[key]}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field("Full Name", "name", "text", "Ahmed Wassim")}
      {field("Email Address", "email", "email", "ahmed@example.com")}

      {/* Phone with country code */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Phone Number
        </label>
        <div className="flex gap-2">
          <PhoneInput
            international
            defaultCountry="EG"
            value={form.phone}
            onChange={(val) => setForm((f) => ({ ...f, phone: val || "" }))}
            onCountryChange={(country) =>
              setForm((f) => ({ ...f, phone_country_code: country || "EG" }))
            }
            className={cn(
              "phone-input-root flex w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors",
              errors.phone
                ? "border-red-500 focus-within:border-red-400"
                : "border-zinc-700 focus-within:border-amber-500"
            )}
            numberInputProps={{
              className: "flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-600 w-full ml-3"
            }}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-red-400">{errors.phone}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing…" : "Confirm & Pay →"}
      </button>
    </form>
  );
}
