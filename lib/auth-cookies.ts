import { getCookieDomain } from "./tenant";

const TOKEN_KEY = "token";
const MAX_AGE_DAYS = 7;

/** Sync token to a cookie so middleware can protect /dashboard routes. */
export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  const domain = getCookieDomain(window.location.hostname);
  
  let cookieStr = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  if (domain !== "localhost") {
    cookieStr += `; Domain=${domain}`;
  }
  document.cookie = cookieStr;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const domain = getCookieDomain(window.location.hostname);
  
  let cookieStr = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (domain !== "localhost") {
    cookieStr += `; Domain=${domain}`;
  }
  document.cookie = cookieStr;
}
