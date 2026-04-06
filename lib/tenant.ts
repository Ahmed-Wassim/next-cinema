export function getTenantFromHostname(hostname: string): string | null {
  if (!hostname) return null;

  const cleanHostname = hostname.split(":")[0];
  const parts = cleanHostname.split(".");

  // Example: analytics.foo.cinema.test
  if (parts[0] === "analytics" && parts.length >= 4) {
    return parts[1];
  }
  
  // Example: foo.cinema.test
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return null;
}

export function getCookieDomain(hostname: string): string {
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return "localhost";
  }

  const cleanHostname = hostname.split(":")[0];
  const parts = cleanHostname.split(".");

  if (parts.length >= 2) {
    // Share across all subdomains by using the root domain
    // e.g. cinema.test
    return `.${parts.slice(-2).join(".")}`;
  }

  return hostname;
}
