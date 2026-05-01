import { redirect } from "next/navigation";

/** Middleware sends operators to /review; this is a fallback. */
export default function HomePage() {
  redirect("/review");
}
