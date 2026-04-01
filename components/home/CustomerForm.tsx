"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookingCustomer } from "@/types/home";
import { cn } from "@/lib/utils";
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input/input";
import enLabels from "react-phone-number-input/locale/en.json";
import { ChevronDown, Search } from "lucide-react";

interface CustomerFormProps {
  onSubmit: (customer: BookingCustomer) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  onSubmit,
  isLoading = false,
  submitLabel,
}: CustomerFormProps) {
  const [form, setForm] = useState<BookingCustomer>({
    name: "",
    email: "",
    phone_country_code: "EG",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<BookingCustomer>>({});
  const preferredCountries = useMemo(
    () => ["EG", "SA", "AE", "US", "GB", "FR"] as Country[],
    [],
  );
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryMenuRef = useRef<HTMLDivElement>(null);

  const countryEntries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(getCountries().filter((country) => country !== "AC")),
    );
    return uniqueCountries
      .map((country) => ({
        country,
        name: enLabels[country] ?? country,
        callingCode: `+${getCountryCallingCode(country)}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const selectedCountry = (form.phone_country_code || "EG") as Country;
  const selectedCountryLabel = enLabels[selectedCountry] ?? selectedCountry;
  const selectedCallingCode = `+${getCountryCallingCode(selectedCountry)}`;
  const filteredCountryEntries = useMemo(() => {
    const normalizedQuery = countryQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      const preferred = preferredCountries
        .map((country) =>
          countryEntries.find((entry) => entry.country === country),
        )
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
      const remaining = countryEntries.filter(
        (entry) => !preferredCountries.includes(entry.country),
      );
      return {
        preferred,
        results: remaining.slice(0, 18),
        totalMatches: countryEntries.length,
      };
    }

    const matches = countryEntries.filter((entry) => {
      const haystack =
        `${entry.name} ${entry.country} ${entry.callingCode}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    return {
      preferred: [] as typeof countryEntries,
      results: matches.slice(0, 40),
      totalMatches: matches.length,
    };
  }, [countryEntries, countryQuery, preferredCountries]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        countryMenuRef.current &&
        !countryMenuRef.current.contains(event.target as Node)
      ) {
        setCountryMenuOpen(false);
      }
    }

    if (!countryMenuOpen) return;
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [countryMenuOpen]);

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
    placeholder = "",
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
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className={cn(
            "w-full rounded-xl border bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors",
            errors[key]
              ? "border-red-500 focus:border-red-400"
              : "border-[var(--border)] focus:border-[var(--accent)]",
          )}
        />
        {errors[key] && <p className="text-xs text-red-400">{errors[key]}</p>}
      </div>
    );
  }

  function getFlagEmoji(country: string) {
    return country
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0)),
      );
  }

  function renderCountryOption(country: Country) {
    const entry = countryEntries.find((item) => item.country === country);
    const name = entry?.name ?? country;
    const callingCode =
      entry?.callingCode ?? `+${getCountryCallingCode(country)}`;
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-base leading-none">
            {getFlagEmoji(country)}
          </span>
          <span className="truncate">{name}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold tracking-wide text-[var(--accent-soft)]">
          {callingCode}
        </span>
      </div>
    );
  }

  function selectCountry(country: Country) {
    setForm((f) => ({ ...f, phone_country_code: country }));
    setCountryMenuOpen(false);
    setCountryQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field("Full Name", "name", "text", "Ahmed Wassim")}
      {field("Email Address", "email", "email", "ahmed@example.com")}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Phone Number
        </label>
        <div
          className={cn(
            "grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]",
            errors.phone && "text-red-400",
          )}
        >
          <div className="relative" ref={countryMenuRef}>
            <button
              type="button"
              onClick={() => setCountryMenuOpen((open) => !open)}
              className={cn(
                "flex h-12 w-full items-center gap-2 rounded-xl border bg-[var(--bg-secondary)] px-3 text-left text-[var(--text-primary)] shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35",
                errors.phone ? "border-red-500" : "border-[var(--border)]",
              )}
            >
              <span className="text-base leading-none">
                {getFlagEmoji(selectedCountry)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {selectedCountryLabel}
              </span>
              <span className="text-xs font-semibold tracking-wide text-[var(--accent-soft)]">
                {selectedCallingCode}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform",
                  countryMenuOpen && "rotate-180",
                )}
              />
            </button>

            {countryMenuOpen && (
              <div className="absolute bottom-full z-50 mb-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/30">
                <div className="border-b border-white/8 p-3">
                  <label className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                    <Search className="h-4 w-4 text-[var(--text-secondary)]" />
                    <input
                      autoFocus
                      value={countryQuery}
                      onChange={(e) => setCountryQuery(e.target.value)}
                      placeholder="Search country or code"
                      className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                    />
                  </label>
                </div>

                <div className="max-h-72 overflow-x-hidden overflow-y-auto p-2">
                  {!countryQuery &&
                    filteredCountryEntries.preferred.length > 0 && (
                      <div className="mb-2">
                        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                          Common
                        </p>
                        <div className="space-y-1">
                          {filteredCountryEntries.preferred.map((entry) => (
                            <button
                              key={`preferred-${entry.country}`}
                              type="button"
                              onClick={() => selectCountry(entry.country)}
                              className="flex w-full items-center rounded-xl px-2 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-white/8"
                            >
                              {renderCountryOption(entry.country)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  <div>
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                      {countryQuery ? "Search results" : "More countries"}
                    </p>
                    <div className="space-y-1">
                      {filteredCountryEntries.results.map((entry) => (
                        <button
                          key={entry.country}
                          type="button"
                          onClick={() => selectCountry(entry.country)}
                          className="flex w-full items-center rounded-xl px-2 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-white/8"
                        >
                          {renderCountryOption(entry.country)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredCountryEntries.results.length === 0 && (
                    <p className="px-2 py-6 text-center text-sm text-[var(--text-secondary)]">
                      No countries matched your search.
                    </p>
                  )}
                </div>

                <div className="border-t border-white/8 px-4 py-2 text-xs text-[var(--text-secondary)]">
                  {countryQuery
                    ? `Showing ${filteredCountryEntries.results.length} of ${filteredCountryEntries.totalMatches} matches`
                    : "Common picks first, then a short list to keep the menu fast"}
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex h-12 items-center rounded-xl border bg-[var(--bg-secondary)] px-4 transition-colors",
              errors.phone
                ? "border-red-500 focus-within:border-red-400"
                : "border-[var(--border)] focus-within:border-[var(--accent)]",
            )}
          >
            <span className="shrink-0 text-sm font-semibold text-[var(--accent-soft)]">
              {selectedCallingCode}
            </span>
            <PhoneInput
              country={selectedCountry}
              international={false}
              value={form.phone}
              onChange={(val) => setForm((f) => ({ ...f, phone: val || "" }))}
              className="ml-3 w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
              placeholder="10 1234 5678"
            />
          </div>
        </div>
        {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-bold text-black shadow-lg shadow-[var(--accent)]/25 transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Processing..." : submitLabel ?? "Confirm & Pay ->"}
      </button>
    </form>
  );
}
