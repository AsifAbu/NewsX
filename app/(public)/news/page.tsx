import { redirect } from "next/navigation";

// `/news` with no slug isn't a real page — redirect to the Dashboard instead
// of 404ing, since a 404 here was causing a client-side reload loop.
export default function NewsIndexPage() {
  redirect("/");
}
