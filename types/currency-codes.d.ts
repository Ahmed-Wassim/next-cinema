declare module "currency-codes" {
  export const data: Array<{
    code: string;
    number: string;
    digits: number;
    currency: string;
    countries: string[];
  }>;
  export function codes(): string[];
}
