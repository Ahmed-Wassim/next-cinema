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
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
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
            "w-full rounded-xl border bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors",
            errors[key]
              ? "border-red-500 focus:border-red-400"
              : "border-[var(--border)] focus:border-[var(--accent)]"
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
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
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
              "phone-input-root flex w-full rounded-xl border bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-colors",
              errors.phone
                ? "border-red-500 focus-within:border-red-400"
                : "border-[var(--border)] focus-within:border-[var(--accent)]"
            )}
            numberInputProps={{
              className: "flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] w-full ml-3"
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
        className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-bold text-black shadow-lg shadow-[var(--accent)]/25 transition-all hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing…" : "Confirm & Pay →"}
      </button>
    </form>
  );
}
