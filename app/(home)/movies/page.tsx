import { MoviesPageClient } from "@/components/home/MoviesPageClient";

export const metadata = {
  title: "Now Playing - CineBook",
  description: "Browse movies currently showing at your local cinema",
};

export default function MoviesPage() {
  return <MoviesPageClient />;
}
